const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const SupplierLedger = require( '../models/parties/SupplierLedger' );
const { supplierTxns } = require( '../utils/constants' );
const { publicS3Object, deleteS3Object, addBatchStock, removeBatchStock } = require( '../utils' );
const StockTransactions = require( '../models/stock/StockTransactions' );
const Item = require( '../models/stock/Item' );
const RTV = require( '../models/purchase/RTV' );

router.use(authCheck);

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");

    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      rtvNumber: store.idsCursors.rtvCursor,
      supplierId: req.body.supplierId,
      grnId: req.body.grnId ? req.body.grnId : null,
      
      items: [],

      attachment: req.body.attachment ? req.body.attachment : "",
      notes: req.body.notes ? req.body.notes : "",

      rtvDate: req.body.rtvDate ? moment(req.body.rtvDate).tz('Asia/Karachi').toDate() : null,
      creationDate: now,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];

    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;

    items.forEach(item => {
      let costPrice = isNaN(item.costPrice) ? 0 : Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      let adjustment = isNaN(item.adjustment) ? 0 :  quantity * Number(item.adjustment);
      let tax = isNaN(item.tax) ? 0 :  quantity * Number(item.tax);
      if(quantity === 0 || quantity < 0) return;
      totalItems++;
      totalQuantity += quantity;
      totalAmount += costPrice * quantity;
      totalAmount += tax;
      totalAmount -= adjustment;
      
      let batches = [];
      if(item.batches && item.batches.length !== 0)
        item.batches.forEach(batch => {
          if(!batch.batchNumber || batch.batchQuantity === 0) return;
          let parts = batch.batchNumber.split("----");
          if(!parts[0] || !parts[1]) return;
          batches.push({
            batchNumber: parts[0],
            batchExpiryDate: parts[1],
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });

      record.items.push({
        _id: item._id,
        costPrice,
        adjustment: isNaN(item.adjustment) ? 0 : Number(item.adjustment),
        tax: isNaN(item.tax) ? 0 : Number(item.tax),
        quantity,
        batches,
        notes: item.notes ? item.notes : ""
      });

    });

    
    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);
    
    const rtv = new RTV(record);
    await rtv.save();

    let parentItem = null;
    let dbItem = null;
    let item = null;
    for(let index = 0; index < rtv.items.length; index++)
    {
      item = rtv.items[index];
      dbItem = await Item.findById(item._id);
      if(!dbItem) continue;
      parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

      rtv.items[index].parentId = parentItem ? parentItem._id : null; //parent of pack, save for delete or update

      await new StockTransactions({
        storeId: store._id,
        userId: req.user._id,
        itemId: parentItem ? parentItem._id : dbItem._id,
        categoryId: dbItem.categoryId,
        packId: parentItem ? dbItem._id : null,
        saleId: null,
        grnId: null,
        rtvId: rtv._id,
        reasonId: null,
        quantity: -1 * (parentItem ? item.quantity * dbItem.packQuantity : item.quantity),
        batches: item.batches,
        notes: item.notes,
        time: now
      }).save();

      let currentStock = parentItem ? parentItem.currentStock : dbItem.currentStock;
      let newQuantity = parentItem ? item.quantity * dbItem.packQuantity : item.quantity;//convert to units if pack

      let itemUpdate = {
        currentStock: +(currentStock - newQuantity).toFixed(2),
        lastUpdated: now
      }
      dbItem.set(itemUpdate);
      await dbItem.save();
      if(parentItem)
      {
        parentItem.set(itemUpdate);
        await parentItem.save();
      }
      //update other packings of Item
      await Item.updateMany({ packParentId: parentItem ? parentItem._id : dbItem._id }, { currentStock: itemUpdate.currentStock, lastUpdated: now });
      await removeBatchStock(dbItem, item, now, parentItem);
    }

    await rtv.save(); //save previous costs

    store.idsCursors.rtvCursor = store.idsCursors.rtvCursor + 1;
    await store.save();
    if(req.body.attachment)
    {
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/rtvs/' + req.body.attachment;
      await publicS3Object( key );
    }
    
    //log Transactions
    record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      supplierId: req.body.supplierId,
      rtvId: rtv._id,
      grnId: null,
      bankId: null,
      amount: -1 * rtv.totalAmount,
      type: supplierTxns.SUPPLIER_TXN_TYPE_RETURN,
      description: "Goods Returned",
      notes: req.body.notes ? req.body.notes : "",
      time: moment(req.body.rtvDate).toDate(),
      lastUpdated: now
    }
    let ledgerTxn = new SupplierLedger(record);
    await ledgerTxn.save();

    //credit case
    let supplierUpdate = {
      totalReturns: +(supplier.totalReturns + rtv.totalAmount).toFixed(2),
      currentBalance: +(supplier.currentBalance - rtv.totalAmount).toFixed(2),
      lastUpdated: now,
    }
    const lastAction = store.dataUpdated.suppliers;
    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    await store.logCollectionLastUpdated('items', now);
    res.json({
      rtv,
      supplier,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/update', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.rtvId) throw new Error("rtvId is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");
    
    const rtv = await RTV.findOne({ _id: req.body.rtvId, storeId: req.body.storeId});
    if(!rtv) throw new Error("invalid Request");
    if(store.lastEndOfDay && moment(rtv.rtvDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot update RTV done before last end of day");
    
    const now = moment().tz('Asia/Karachi').toDate();
    if(req.body.attachment && rtv.attachment !== req.body.attachment) // uploaded new image, 
    {
      if(rtv.attachment) // if item has old image , delete old image
        await deleteS3Object( process.env.AWS_KEY_PREFIX + req.body.storeId + '/rtvs/' + rtv.attachment );
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/rtvs/' + req.body.attachment;
      await publicS3Object( key );
    }

    let record = {
      userId: req.user._id,
      items: [],

      attachment: req.body.attachment ? req.body.attachment : "",
      notes: req.body.notes ? req.body.notes : "",

      rtvDate: req.body.rtvDate ? moment(req.body.rtvDate).tz('Asia/Karachi').toDate() : null,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];
    let itemMaps = {};
    items.forEach(item => { 
      itemMaps[ item._id ] = item;
    });

    let newRtvItems = []; //new & Final list of GRN items
    for(let index = 0; index < rtv.items.length; index++)
    {
      let item =  rtv.items[index];
      let formItem = itemMaps[item._id];
      
      let dbItem = await Item.findById(item._id);
      if(!dbItem){
        delete itemMaps[item._id]; //delete from formItems 
        continue;
      }
      let parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

      await addBatchStock(dbItem, item, now, parentItem); //if item removed from GRN or Item update in GRN
      
      if(!formItem || isNaN(formItem.quantity) || Number(formItem.quantity) === 0 ) // item deleted or item quantity 0
      {
        let baseItemId = item.parentId ? item.parentId : item._id;
        await StockTransactions.deleteMany({
          storeId: store._id,
          rtvId: rtv._id,
          itemId: baseItemId,
          packId: item.parentId ? item._id : null,
        });

        let aggregate = await StockTransactions.aggregate([
          { $match: { storeId: store._id, itemId: baseItemId} },
          { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
        ]);
        let currentStock = aggregate.length ? aggregate[0].currentStock : 0;
        await Item.findByIdAndUpdate(baseItemId, { currentStock, lastUpdated: now }); //revert old cost and sale price
        await Item.updateMany({ packParentId: baseItemId }, { currentStock, lastUpdated: now }); //update old cost and current stock in all packings 
        delete itemMaps[item._id];
        continue;
      }
      
      let costPrice = isNaN(formItem.costPrice) ? 0 : Number(formItem.costPrice);
      let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
      
      let batches = [];
      if(formItem.batches && formItem.batches.length !== 0)
        formItem.batches.forEach(batch => {
          if(!batch.batchNumber || batch.batchQuantity === 0) return;
          let parts = batch.batchNumber.split("----");
          if(!parts[0] || !parts[1]) return;
          batches.push({
            batchNumber: parts[0],
            batchExpiryDate: parts[1],
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });

      let rtvItem = {
        _id: formItem._id,
        parentId: item.parentId,
        costPrice,
        adjustment: isNaN(formItem.adjustment) ? 0 : Number(formItem.adjustment),
        tax: isNaN(formItem.tax) ? 0 : Number(formItem.tax),
        quantity,
        batches,
        notes: formItem.notes ? formItem.notes : "",
      }
      newRtvItems.push(rtvItem);
      
      await StockTransactions.findOneAndUpdate({
        storeId: store._id,
        rtvId: rtv._id,
        itemId: parentItem ? parentItem._id : dbItem._id,
        packId: parentItem ? dbItem._id : null,
      }, {
        userId: req.user._id,
        packId: parentItem ? dbItem._id : null,
        quantity: -1 * (parentItem ? quantity * dbItem.packQuantity : quantity), //convert to units if pack
        batches,
        notes: item.notes,
        time: now
      });

      let aggregate = await StockTransactions.aggregate([
        { $match: { storeId: store._id, itemId: parentItem ? parentItem._id : dbItem._id} },
        { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
      ]);
      let currentStock = aggregate.length ? aggregate[0].currentStock : 0;

      let itemUpdate = {
        currentStock,
        lastUpdated: now
      }
      dbItem.set(itemUpdate);
      await dbItem.save();
      if(parentItem)
      {
        parentItem.set(itemUpdate);
        await parentItem.save();
      }
      //update all packings of item
      await Item.updateMany({ packParentId: parentItem ? parentItem._id : dbItem._id }, { currentStock, lastUpdated: now });
      await removeBatchStock(dbItem, rtvItem, now, parentItem);
      delete itemMaps[item._id]; //delete from formItems 
    }

    //process newly added items
    for(let itemId in itemMaps)
    {
      item = itemMaps[itemId];

      let dbItem = await Item.findById(item._id);
      if(!dbItem){
        delete itemMaps[item._id]; //delete from formItems 
        continue;
      }
      let parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

      let costPrice = isNaN(item.costPrice) ? 0 : Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      let adjustment = isNaN(item.adjustment) ? 0 :  quantity * Number(item.adjustment);
      let tax = isNaN(item.tax) ? 0 :  quantity * Number(item.tax);
      if(quantity === 0 || quantity < 0) return;
      
      let batches = [];
      if(item.batches && item.batches.length !== 0)
        item.batches.forEach(batch => {
          if(!batch.batchNumber || batch.batchQuantity === 0) return;
          let parts = batch.batchNumber.split("----");
          if(!parts[0] || !parts[1]) return;
          batches.push({
            batchNumber: parts[0],
            batchExpiryDate: parts[1],
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });
      
      rtvItem = {
        _id: item._id,
        parentId: parentItem ? parentItem._id : null,
        costPrice,
        adjustment: isNaN(item.adjustment) ? 0 : Number(item.adjustment),
        tax: isNaN(item.tax) ? 0 : Number(item.tax),
        quantity,
        batches,
        notes: item.notes ? item.notes : ""
      };
      newRtvItems.push(rtvItem);

      await new StockTransactions({
        storeId: store._id,
        userId: req.user._id,
        itemId: parentItem ? parentItem._id : dbItem._id,
        categoryId: dbItem.categoryId,
        packId: parentItem ? dbItem._id : null,
        saleId: null,
        rtvId: rtv._id,
        grnId: null,
        reasonId: null,
        quantity: -1 * (parentItem ? rtvItem.quantity * dbItem.packQuantity : rtvItem.quantity),
        batches,
        notes: item.notes,
        time: now
      }).save();

      let currentStock = parentItem ? parentItem.currentStock : dbItem.currentStock;
      let newQuantity = parentItem ? rtvItem.quantity * dbItem.packQuantity : rtvItem.quantity;//convert to units if pack

      let itemUpdate = {
        currentStock: +(currentStock - newQuantity).toFixed(2),
        lastUpdated: now
      }
      dbItem.set(itemUpdate);
      await dbItem.save();
      if(parentItem)
      {
        parentItem.set(itemUpdate);
        await parentItem.save();
      }
      //update other packings of Item
      await Item.updateMany({ packParentId: parentItem ? parentItem._id : dbItem._id }, { currentStock: itemUpdate.currentStock, lastUpdated: now });
      await removeBatchStock(dbItem, rtvItem, now, parentItem);
    }

    record.items = newRtvItems;

    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;

    record.items.forEach(item => {
      totalItems++;
      totalQuantity += item.quantity;
      totalAmount += item.costPrice * item.quantity;
      totalAmount += item.tax * item.quantity;
      totalAmount -= item.adjustment * item.quantity;
    });

    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);

    rtv.set(record);
    await rtv.save();

    let ledgerReturnTxn = await SupplierLedger.findOne({ storeId: req.body.storeId, rtvId: rtv._id, type: supplierTxns.SUPPLIER_TXN_TYPE_RETURN }); 

    record = {
      userId: req.user._id,
      bankId: null,
      amount: -1 * rtv.totalAmount,
      notes: req.body.notes ? req.body.notes : "",
      time: moment(req.body.rtvDate).toDate(),
      lastUpdated: now
    }
    if(ledgerReturnTxn)
    {
      ledgerReturnTxn.set(record);
      await ledgerReturnTxn.save();
    }

    //credit case
    let supplierUpdate = {
      totalReturns: supplier.totalReturns,
      currentBalance: supplier.openingBalance,
      lastUpdated: now,
    }

    aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id, type: supplierTxns.SUPPLIER_TXN_TYPE_RETURN } },
      { $group: { _id: "$supplierId", totalReturns: { $sum: "$amount" } } }
    ]);
    supplierUpdate.totalReturns = aggregate.length ? aggregate[0].totalReturns : 0;

    aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id } },
      { $group: { _id: "$supplierId", currentBalance: { $sum: "$amount" } } }
    ]);
    supplierUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    const lastAction = store.dataUpdated.suppliers;
    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    await store.logCollectionLastUpdated('items', now);

    res.json({
      rtv,
      supplier,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.rtvId) throw new Error("RTV ID is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    
    const rtv = await RTV.findOne({ _id: req.body.rtvId, storeId: req.body.storeId});
    if(!rtv) throw new Error("invalid Request");
    if(store.lastEndOfDay && moment(rtv.rtvDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete RTV done before last end of day");

    const now = moment().tz('Asia/Karachi').toDate();

    let dbItem = null;
    let parentItem = null;
    for(let index = 0; index < rtv.items.length; index++)
    {
      let item =  rtv.items[index];
      let baseItemId = item.parentId ? item.parentId : item._id;
      await StockTransactions.deleteMany({
        storeId: store._id,
        rtvId: rtv._id,
        itemId: baseItemId,
        packId: item.parentId ? item._id : null
      });

      let aggregate = await StockTransactions.aggregate([
        { $match: { storeId: store._id, itemId: baseItemId} },
        { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
      ]);
      let currentStock = aggregate.length ? aggregate[0].currentStock : 0;
      await Item.findByIdAndUpdate(baseItemId, { currentStock, lastUpdated: now }); //revert old cost and sale price
      await Item.updateMany({ packParentId: baseItemId }, { currentStock, lastUpdated: now }); //update old cost and current stock in all packings 
      
      dbItem = await Item.findById(item._id);
      if(!dbItem) continue;
      parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;
      await addBatchStock(dbItem, item, now, parentItem);
    }

    let supplier = await Supplier.findById(rtv.supplierId);

    let supplierUpdate = {
      totalReturns: +(supplier.totalReturns - rtv.totalAmount).toFixed(2),
      currentBalance: +(supplier.currentBalance + rtv.totalAmount).toFixed(2),
      lastUpdated: now,
    }

    await SupplierLedger.deleteMany({ storeId: req.body.storeId, rtvId: req.body.rtvId });
    await RTV.findOneAndDelete({ _id: req.body.rtvId, storeId: req.body.storeId });
    
    const lastAction = store.dataUpdated.suppliers;
    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    await store.logCollectionLastUpdated('items', now);

    res.json( { 
      success: true,
      supplier,
      now,
      lastAction 
    } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/', async (req, res) => {
  try
  {
    if(!req.body.storeId)
      throw new Error("Store id is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
    }
    if(req.body.supplierId)
      conditions.supplierId = req.body.supplierId;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       let startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       let endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.rtvDate = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await RTV.countDocuments(conditions);
    
    const rtvs = await RTV.find(conditions, null, { skip, limit: recordsPerPage, sort : { creationDate: -1 }  });

    res.json({
      rtvs,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;