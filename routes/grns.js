const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const SupplierLedger = require( '../models/parties/SupplierLedger' );
const { poStates, payOrCreditOptions, paymentModes, supplierTxns } = require( '../utils/constants' );
const PurchaseOrder = require( '../models/purchase/PurchaseOrder' );
const GRN = require( '../models/purchase/GRN' );
const RTV = require( '../models/purchase/RTV' );
const { publicS3Object, deleteS3Object, addBatchStock, removeBatchStock } = require( '../utils' );
const AccountTransaction = require( '../models/accounts/AccountTransaction' );
const StockTransactions = require( '../models/stock/StockTransactions' );
const Item = require( '../models/stock/Item' );

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
      grnNumber: store.idsCursors.grnCursor,
      supplierId: req.body.supplierId,
      poId: req.body.poId ? req.body.poId : null,
      payOrCredit: req.body.payOrCredit,
      bankId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      chequeTxnId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.chequeTxnId : "",
      
      items: [],

      //Bill details
      supplierInvoiceNumber: req.body.supplierInvoiceNumber ? req.body.supplierInvoiceNumber : "",
      billNumber: req.body.billNumber ? req.body.billNumber : "",
      billDate: req.body.billDate ? moment(req.body.billDate).tz('Asia/Karachi').toDate() : null,
      billDueDate: req.body.billDueDate ? moment(req.body.billDueDate).tz('Asia/Karachi').toDate() : null,

      //other Expenses
      loadingExpense: req.body.loadingExpense ? Number(req.body.loadingExpense) : 0,
      freightExpense: req.body.freightExpense ? Number(req.body.freightExpense) : 0,
      otherExpense: req.body.otherExpense ? Number(req.body.otherExpense) : 0,
      adjustmentAmount: req.body.adjustmentAmount ? Number(req.body.adjustmentAmount) : 0,
      purchaseTax: req.body.purchaseTax ? Number(req.body.purchaseTax) : 0,
      
      attachment: req.body.attachment ? req.body.attachment : "",
      notes: req.body.notes ? req.body.notes : "",

      grnDate: req.body.grnDate ? moment(req.body.grnDate).tz('Asia/Karachi').toDate() : null,
      creationDate: now,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];

    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalExpenses = 0;
    let totalTax = 0;

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
      totalTax += tax;
      totalExpenses -= adjustment; // it is deducted from total amount
      let batches = [];
      if(item.batches && item.batches.length !== 0)
        item.batches.forEach(batch => {
          if(!batch.batchNumber || !batch.batchExpiryDate || batch.batchQuantity === 0) return;
          batches.push({
            batchNumber: batch.batchNumber,
            batchExpiryDate: moment(batch.batchExpiryDate).toDate(),
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });


      record.items.push({
        _id: item._id,
        costPrice: isNaN(costPrice) ? 0 : costPrice,
        salePrice: isNaN(item.salePrice) ? 0 : Number(item.salePrice),
        packSalePrice: isNaN(item.packSalePrice) ? 0 : Number(item.packSalePrice),
        adjustment: isNaN(item.adjustment) ? 0 : Number(item.adjustment),
        tax: isNaN(item.tax) ? 0 : Number(item.tax),
        quantity,
        batches,
        notes: item.notes ? item.notes : ""
      });

    });

    totalExpenses += isNaN(req.body.loadingExpense) ? 0 : Number(req.body.loadingExpense);
    totalExpenses += isNaN(req.body.freightExpense) ? 0 : Number(req.body.freightExpense);
    totalExpenses += isNaN(req.body.otherExpense) ? 0 : Number(req.body.otherExpense);
    totalExpenses += isNaN(req.body.adjustmentAmount) ? 0 : Number(req.body.adjustmentAmount);
    totalTax += isNaN(req.body.purchaseTax) ? 0 : Number(req.body.purchaseTax);

    totalAmount += isNaN(req.body.loadingExpense) ? 0 : Number(req.body.loadingExpense);
    totalAmount += isNaN(req.body.freightExpense) ? 0 : Number(req.body.freightExpense);
    totalAmount += isNaN(req.body.otherExpense) ? 0 : Number(req.body.otherExpense);
    totalAmount += isNaN(req.body.adjustmentAmount) ? 0 : Number(req.body.adjustmentAmount);
    totalAmount += isNaN(req.body.purchaseTax) ? 0 : Number(req.body.purchaseTax);

    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);
    record.totalExpenses = +totalExpenses.toFixed(2);
    record.totalTax = +totalTax.toFixed(2);

    const grn = new GRN(record);
    await grn.save();

    let parentItem = null;
    let dbItem = null;
    let item = null;
    for(let index = 0; index < grn.items.length; index++)
    {
      item = grn.items[index];
      dbItem = await Item.findById(item._id);
      if(!dbItem) continue;
      parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

      grn.items[index].parentId = parentItem ? parentItem._id : null; //parent of pack, save for delete or update
      grn.items[index].prevCostPrice = parentItem ? parentItem.costPrice : dbItem.costPrice;
      grn.items[index].prevSalePrice = parentItem ? parentItem.salePrice : dbItem.salePrice;
      grn.items[index].prevPackSalePrice = parentItem ? dbItem.packSalePrice : 0; //purchasing in pack

      await new StockTransactions({
        storeId: store._id,
        userId: req.user._id,
        itemId: parentItem ? parentItem._id : dbItem._id,
        categoryId: dbItem.categoryId,
        packId: parentItem ? dbItem._id : null,
        saleId: null,
        grnId: grn._id,
        rtvId: null,
        reasonId: null,
        quantity: parentItem ? item.quantity * dbItem.packQuantity : item.quantity,
        batches: item.batches,
        notes: item.notes,
        time: now
      }).save();

      let costPrice = item.costPrice;
      if(parentItem)//pack item, find unit cost price
        costPrice = +(costPrice/(dbItem.packQuantity)).toFixed(2); //find unit cost 
      let currentStock = parentItem ? parentItem.currentStock : dbItem.currentStock;
      let prevCostPrice = parentItem ? parentItem.costPrice : dbItem.costPrice; // unit cost price
      let newQuantity = parentItem ? item.quantity * dbItem.packQuantity : item.quantity;//convert to units if pack
      if(store.configuration.weightedCostPrice) //find average weighted cost
      {
        let totalWeightedValue = (prevCostPrice * currentStock) + (costPrice * newQuantity);
        let totalQuantity = currentStock + newQuantity;
        costPrice = +(totalWeightedValue /  totalQuantity).toFixed(2);
      }
      costPrice = isNaN(costPrice) ? 0: costPrice;
      let itemUpdate = {
        currentStock: currentStock + newQuantity,
        costPrice, //new cost Price
        salePrice: item.salePrice,
        packSalePrice: item.packSalePrice,
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
      await Item.updateMany({ packParentId: parentItem ? parentItem._id : dbItem._id }, { currentStock: itemUpdate.currentStock, costPrice, salePrice: itemUpdate.salePrice, lastUpdated: now });
      await addBatchStock(dbItem, item, now, parentItem);
    }

    await grn.save(); //save previous costs

    store.idsCursors.grnCursor = store.idsCursors.grnCursor + 1;
    await store.save();
    if(req.body.attachment)
    {
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/grns/' + req.body.attachment;
      await publicS3Object( key );
    }
    //Close PO
    if(req.body.poId)
    {
      await PurchaseOrder.findByIdAndUpdate(req.body.poId, { status: poStates.PO_STATUS_CLOSED });
    }
    //log Transactions
    record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      supplierId: req.body.supplierId,
      grnId: grn._id,
      rtvId: null,
      bankId: null,
      amount: grn.totalAmount,
      type: supplierTxns.SUPPLIER_TXN_TYPE_PURCHASE,
      description: "Goods purchased",
      notes: req.body.notes ? req.body.notes : "",
      time: moment(req.body.grnDate).toDate(),
      lastUpdated: now
    }
    let ledgerTxn = new SupplierLedger(record);
    await ledgerTxn.save();

    //credit case
    let supplierUpdate = {
      totalPurchases: +(supplier.totalPurchases + grn.totalAmount).toFixed(2),
      totalPayment: supplier.totalPayment,
      currentBalance: +(supplier.currentBalance + grn.totalAmount).toFixed(2),
      lastPurchase: now,
      lastUpdated: now,
    }
    //Pay now case
    let accountTxn = null;
    if(Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW)
    {
      supplierUpdate.currentBalance = supplier.currentBalance; //current balance doesn't change
      supplierUpdate.totalPayment = +(supplier.totalPayment + grn.totalAmount).toFixed(2); //total payments and purchases increase
      supplierUpdate.lastPayment = now; //total payments and purchases increase
      record = {
        storeId: req.body.storeId,
        userId: req.user._id,
        supplierId: req.body.supplierId,
        grnId: grn._id,
        rtvId: null,
        bankId: Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
        amount: -1 * grn.totalAmount,
        type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT,
        description: "Amount paid with GRN",
        notes: req.body.notes ? req.body.notes : "",
        time: moment(req.body.grnDate).toDate(),
        lastUpdated: now
      }
      ledgerTxn = new SupplierLedger(record);
      await ledgerTxn.save();

      const accountRecord = {
        storeId: req.body.storeId,
        userId: req.user._id,
        parentId: ledgerTxn._id,
        headId: store.accountHeadIds.Purchase,
        bankId: Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
        amount: -1 * grn.totalAmount,
        type: parseInt(req.body.paymentMode), //cash or bank
        notes: req.body.notes ? req.body.notes : "",
        description: "Amount paid with GRN to supplier: " + supplier.name,
        time: moment(req.body.grnDate).toDate(),
        lastUpdated: now
      }
      accountTxn = new AccountTransaction(accountRecord);
      await accountTxn.save();
    }
    const lastAction = store.dataUpdated.suppliers;
    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    await store.logCollectionLastUpdated('items', now);
    res.json({
      grn,
      supplier,
      accountTxn,
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
    if(!req.body.grnId) throw new Error("grnId is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");
    
    const grn = await GRN.findOne({ _id: req.body.grnId, storeId: req.body.storeId});
    if(!grn) throw new Error("invalid Request");
    if(store.lastEndOfDay && moment(grn.grnDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot update GRN done before last end of day");
    
    const now = moment().tz('Asia/Karachi').toDate();
    if(req.body.attachment && grn.attachment !== req.body.attachment) // uploaded new image, 
    {
      if(grn.attachment) // if item has old image , delete old image
        await deleteS3Object( process.env.AWS_KEY_PREFIX + req.body.storeId + '/grns/' + grn.attachment );
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/grns/' + req.body.attachment;
      await publicS3Object( key );
    }

    let record = {
      userId: req.user._id,
      payOrCredit: req.body.payOrCredit,
      bankId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      chequeTxnId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.chequeTxnId : "",
      
      items: [],

      //Bill details
      supplierInvoiceNumber: req.body.supplierInvoiceNumber ? req.body.supplierInvoiceNumber : "",
      billNumber: req.body.billNumber ? req.body.billNumber : "",
      billDate: req.body.billDate ? moment(req.body.billDate).tz('Asia/Karachi').toDate() : null,
      billDueDate: req.body.billDueDate ? moment(req.body.billDueDate).tz('Asia/Karachi').toDate() : null,

      //other Expenses
      loadingExpense: req.body.loadingExpense ? Number(req.body.loadingExpense) : 0,
      freightExpense: req.body.freightExpense ? Number(req.body.freightExpense) : 0,
      otherExpense: req.body.otherExpense ? Number(req.body.otherExpense) : 0,
      adjustmentAmount: req.body.adjustmentAmount ? Number(req.body.adjustmentAmount) : 0,
      purchaseTax: req.body.purchaseTax ? Number(req.body.purchaseTax) : 0,
      
      attachment: req.body.attachment ? req.body.attachment : "",
      notes: req.body.notes ? req.body.notes : "",

      grnDate: req.body.grnDate ? moment(req.body.grnDate).tz('Asia/Karachi').toDate() : null,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];
    let itemMaps = {};
    items.forEach(item => { 
      itemMaps[ item._id ] = item;
    });

    let newGrnItems = []; //new & Final list of GRN items
    let itemsNotUpdated = 0;
    for(let index = 0; index < grn.items.length; index++)
    {
      let item =  grn.items[index];
      let conditions = {
        storeId: req.body.storeId,
        creationDate: { $gt: grn.creationDate  }, //get grns created after this GRN
      }
      if(item.parentId) //this item was purchased in pack, find if any units, this pack or any other pack of this item are purchased after this
      {
        conditions['$or'] = [{ "items._id" : item.parentId }, { "items.parentId": item.parentId }];
      }else //this item was purchased in units, find if any units, this pack or any other pack of this item are purchased after this
      {
        conditions['$or'] = [{ "items._id" : item._id }, { "items.parentId": item._id }];
      }
      let futureGrn = await GRN.findOne(conditions);
      if(futureGrn)
      {
        itemsNotUpdated += 1;
        newGrnItems.push( item ); //items remain unchanged, no updates no deletes
        delete itemMaps[item._id]; //delete from formItems 
        continue;
      }
      
      let formItem = itemMaps[item._id];
      
      let dbItem = await Item.findById(item._id);
      if(!dbItem){
        delete itemMaps[item._id]; //delete from formItems 
        continue;
      }
      let parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

      await removeBatchStock(dbItem, item, now, parentItem); //if item removed from GRN or Item update in GRN
      
      if(!formItem || isNaN(formItem.quantity) || Number(formItem.quantity) === 0 ) // item deleted or item quantity 0
      {
        let baseItemId = item.parentId ? item.parentId : item._id;
        await StockTransactions.deleteMany({
          storeId: store._id,
          grnId: grn._id,
          itemId: baseItemId,
          packId: item.parentId ? item._id : null,
        });

        let aggregate = await StockTransactions.aggregate([
          { $match: { storeId: store._id, itemId: baseItemId} },
          { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
        ]);
        let currentStock = aggregate.length ? aggregate[0].currentStock : 0;
        await Item.findByIdAndUpdate(baseItemId, { currentStock, costPrice: item.prevCostPrice, salePrice: item.prevSalePrice, lastUpdated: now }); //revert old cost and sale price
        await Item.updateMany({ packParentId: baseItemId }, { currentStock, costPrice: item.prevCostPrice, salePrice: item.prevSalePrice, lastUpdated: now }); //update old cost and current stock in all packings 
        if(item.parentId) //update pack sale of this specific packing
          await Item.findByIdAndUpdate(item._id, { packSalePrice: item.prevPackSalePrice,  lastUpdated: now });
        delete itemMaps[item._id];
        continue;
      }
      
      let costPrice = isNaN(formItem.costPrice) ? 0 : Number(formItem.costPrice);
      let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
      let adjustment = isNaN(formItem.adjustment) ? 0 :  quantity * Number(formItem.adjustment);
      let tax = isNaN(formItem.tax) ? 0 :  quantity * Number(formItem.tax);
      let batches = [];
      if(formItem.batches && formItem.batches.length !== 0)
        formItem.batches.forEach(batch => {
          if(!batch.batchNumber || !batch.batchExpiryDate || batch.batchQuantity === 0) return;
          batches.push({
            batchNumber: batch.batchNumber,
            batchExpiryDate: moment(batch.batchExpiryDate).toDate(),
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });

      let grnItem = {
        _id: formItem._id,
        parentId: item.parentId,
        prevCostPrice: item.prevCostPrice,
        prevSalePrice: item.prevSalePrice,
        prevPackSalePrice: item.prevPackSalePrice,
        costPrice,
        salePrice: isNaN(formItem.salePrice) ? 0 : Number(formItem.salePrice),
        packSalePrice: isNaN(formItem.packSalePrice) ? 0 : Number(formItem.packSalePrice),
        adjustment: isNaN(formItem.adjustment) ? 0 : Number(formItem.adjustment),
        tax: isNaN(formItem.tax) ? 0 : Number(formItem.tax),
        quantity,
        batches,
        notes: formItem.notes ? formItem.notes : "",
      }
      newGrnItems.push(grnItem);
      
      await StockTransactions.findOneAndUpdate({
        storeId: store._id,
        grnId: grn._id,
        itemId: parentItem ? parentItem._id : dbItem._id,
        packId: parentItem ? dbItem._id : null,
      }, {
        userId: req.user._id,
        packId: parentItem ? dbItem._id : null,
        quantity: parentItem ? quantity * dbItem.packQuantity : quantity, //convert to units if pack
        batches,
        notes: item.notes,
        time: now
      });

      let aggregate = await StockTransactions.aggregate([
        { $match: { storeId: store._id, itemId: parentItem ? parentItem._id : dbItem._id} },
        { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
      ]);
      let currentStock = aggregate.length ? aggregate[0].currentStock : 0;

      let unitCostPrice = costPrice;
      if(parentItem)//pack item, find unit cost price
        unitCostPrice = +(costPrice/(dbItem.packQuantity)).toFixed(2); //find unit cost 

      let prevCostPrice = item.prevCostPrice; // unit cost price
      let newQuantity = parentItem ? quantity * dbItem.packQuantity : quantity;//convert to units if pack
      if(store.configuration.weightedCostPrice) //find average weighted cost
      {
        let totalWeightedValue = (prevCostPrice * (currentStock - newQuantity)) + (unitCostPrice * newQuantity); // currently stock includes new quantity
        let totalQuantity = currentStock; //current stock already includes new quantity
        unitCostPrice = +(totalWeightedValue /  totalQuantity).toFixed(2);
      }
      unitCostPrice = isNaN(unitCostPrice) ? 0 : unitCostPrice;
      let itemUpdate = {
        currentStock,
        costPrice: unitCostPrice, //new cost Price
        salePrice: grnItem.salePrice,
        packSalePrice: grnItem.packSalePrice,
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
      await Item.updateMany({ packParentId: parentItem ? parentItem._id : dbItem._id }, { currentStock, costPrice: unitCostPrice, salePrice: grnItem.salePrice, lastUpdated: now });
      await addBatchStock(dbItem, grnItem, now, parentItem);
      delete itemMaps[item._id]; //delete from formItems 
    }

    //process newly added items
    for(let itemId in itemMaps)
    {
      item = itemMaps[itemId];
      let costPrice = isNaN(item.costPrice) ? 0 : Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      if(quantity === 0 || quantity < 0) continue;

      let dbItem = await Item.findById(item._id);
      if(!dbItem){
        delete itemMaps[item._id]; //delete from formItems 
        continue;
      }
      let parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

      let batches = [];
      if(item.batches && item.batches.length !== 0)
        item.batches.forEach(batch => {
          if(!batch.batchNumber || !batch.batchExpiryDate || batch.batchQuantity === 0) return;
          batches.push({
            batchNumber: batch.batchNumber,
            batchExpiryDate: moment(batch.batchExpiryDate).toDate(),
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });
      
      grnItem = {
        _id: item._id,
        parentId: parentItem ? parentItem._id : null,
        prevCostPrice: parentItem ? parentItem.costPrice : dbItem.costPrice,
        prevSalePrice: parentItem ? parentItem.salePrice : dbItem.salePrice,
        prevPackSalePrice: parentItem ? dbItem.packSalePrice : 0,
        costPrice,
        salePrice: isNaN(item.salePrice) ? 0 : Number(item.salePrice),
        packSalePrice: isNaN(item.packSalePrice) ? 0 : Number(item.packSalePrice),
        adjustment: isNaN(item.adjustment) ? 0 : Number(item.adjustment),
        tax: isNaN(item.tax) ? 0 : Number(item.tax),
        quantity,
        batches,
        notes: item.notes ? item.notes : ""
      };
      newGrnItems.push(grnItem);

      await new StockTransactions({
        storeId: store._id,
        userId: req.user._id,
        itemId: parentItem ? parentItem._id : dbItem._id,
        categoryId: dbItem.categoryId,
        packId: parentItem ? dbItem._id : null,
        saleId: null,
        grnId: grn._id,
        rtvId: null,
        reasonId: null,
        quantity: parentItem ? grnItem.quantity * dbItem.packQuantity : grnItem.quantity,
        batches,
        notes: item.notes,
        time: now
      }).save();

      costPrice = grnItem.costPrice;
      if(parentItem)//pack item, find unit cost price
        costPrice = +(costPrice/(dbItem.packQuantity)).toFixed(2); //find unit cost 
      let currentStock = parentItem ? parentItem.currentStock : dbItem.currentStock;
      let prevCostPrice = parentItem ? parentItem.costPrice : dbItem.costPrice; // unit cost price
      let newQuantity = parentItem ? grnItem.quantity * dbItem.packQuantity : grnItem.quantity;//convert to units if pack
      if(store.configuration.weightedCostPrice) //find average weighted cost
      {
        let totalWeightedValue = (prevCostPrice * currentStock) + (costPrice * newQuantity);
        let totalQuantity = currentStock + newQuantity;
        costPrice = +(totalWeightedValue /  totalQuantity).toFixed(2);
      }

      let itemUpdate = {
        currentStock: currentStock + newQuantity,
        costPrice, //new cost Price
        salePrice: item.salePrice,
        packSalePrice: item.packSalePrice,
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
      await Item.updateMany({ packParentId: parentItem ? parentItem._id : dbItem._id }, { currentStock: itemUpdate.currentStock, costPrice, salePrice: itemUpdate.salePrice, lastUpdated: now });
      await addBatchStock(dbItem, grnItem, now, parentItem);
    }

    record.items = newGrnItems;

    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalExpenses = 0;
    let totalTax = 0;

    record.items.forEach(item => {
      totalItems++;
      totalQuantity += item.quantity;
      totalAmount += item.costPrice * item.quantity;
      totalAmount += item.tax * item.quantity;
      totalAmount -= item.adjustment * item.quantity;

      totalExpenses -= item.adjustment * item.quantity;
      totalTax += item.tax * item.quantity;
    });

    totalExpenses += isNaN(req.body.loadingExpense) ? 0 : Number(req.body.loadingExpense);
    totalExpenses += isNaN(req.body.freightExpense) ? 0 : Number(req.body.freightExpense);
    totalExpenses += isNaN(req.body.otherExpense) ? 0 : Number(req.body.otherExpense);
    totalExpenses += isNaN(req.body.adjustmentAmount) ? 0 : Number(req.body.adjustmentAmount);
    totalTax += isNaN(req.body.purchaseTax) ? 0 : Number(req.body.purchaseTax);

    totalAmount += isNaN(req.body.loadingExpense) ? 0 : Number(req.body.loadingExpense);
    totalAmount += isNaN(req.body.freightExpense) ? 0 : Number(req.body.freightExpense);
    totalAmount += isNaN(req.body.otherExpense) ? 0 : Number(req.body.otherExpense);
    totalAmount += isNaN(req.body.adjustmentAmount) ? 0 : Number(req.body.adjustmentAmount);
    totalAmount += isNaN(req.body.purchaseTax) ? 0 : Number(req.body.purchaseTax);

    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);
    record.totalExpenses = +totalExpenses.toFixed(2);
    record.totalTax = +totalTax.toFixed(2);

    grn.set(record);
    await grn.save();

    let ledgerPurchaseTxn = await SupplierLedger.findOne({ storeId: req.body.storeId, grnId: grn._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PURCHASE });
    let ledgerPaymentTxn = await SupplierLedger.findOne({ storeId: req.body.storeId, grnId: grn._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT });
    let accountPaymentTxn = null;
    if(ledgerPaymentTxn)
      accountPaymentTxn = await AccountTransaction.findOne({ storeId: req.body.storeId, parentId: ledgerPaymentTxn._id })

    record = {
      userId: req.user._id,
      bankId: null,
      amount: grn.totalAmount,
      notes: req.body.notes ? req.body.notes : "",
      time: moment(req.body.grnDate).toDate(),
      lastUpdated: now
    }
    if(ledgerPurchaseTxn)
    {
      ledgerPurchaseTxn.set(record);
      await ledgerPurchaseTxn.save();
    }
    let haveOldAccountTxn = accountPaymentTxn ? true : false;//is there any account txn before
    if(Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW)
    {
      //add/update payment txns
      record = {
        storeId: req.body.storeId,
        userId: req.user._id,
        supplierId: req.body.supplierId,
        grnId: grn._id,
        rtvId: null,
        bankId: Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
        amount: -1 * grn.totalAmount,
        type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT,
        description: "Amount paid with GRN",
        notes: req.body.notes ? req.body.notes : "",
        time: moment(req.body.grnDate).toDate(),
        lastUpdated: now
      }
      if(ledgerPaymentTxn)
        ledgerPaymentTxn.set(record);
      else
        ledgerPaymentTxn = new SupplierLedger(record);
      await ledgerPaymentTxn.save();

      const accountRecord = {
        storeId: req.body.storeId,
        userId: req.user._id,
        parentId: ledgerPaymentTxn._id,
        headId: store.accountHeadIds.Purchase,
        bankId: Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
        amount: -1 * grn.totalAmount,
        type: parseInt(req.body.paymentMode), //cash or bank
        notes: req.body.notes ? req.body.notes : "",
        description: "Amount paid with GRN to supplier: " + supplier.name,
        time: moment(req.body.grnDate).toDate(),
        lastUpdated: now
      }
      if(accountPaymentTxn)
        accountPaymentTxn.set(accountRecord);
      else
        accountPaymentTxn = new AccountTransaction(accountRecord);
      await accountPaymentTxn.save();
    }else if(Number(req.body.payOrCredit) === payOrCreditOptions.ON_CREDIT)
    {
      //Delete Payment Txn if exist
      if(accountPaymentTxn)
        await AccountTransaction.findByIdAndDelete(accountPaymentTxn._id);
      if(ledgerPaymentTxn)
        await SupplierLedger.findByIdAndDelete(ledgerPaymentTxn._id);
    }

    //credit case
    let supplierUpdate = {
      totalPayment: supplier.totalPayment,
      totalPurchases: supplier.totalPurchases,
      currentBalance: supplier.openingBalance,
      lastUpdated: now,
    }
    if(Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && moment(grn.grnDate) > moment(supplier.lastPayment))
      supplierUpdate.lastPayment = moment(grn.grnDate);

    let aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$supplierId", totalPayment: { $sum: "$amount" } } }
    ]);
    supplierUpdate.totalPayment = aggregate.length ? -1 * (aggregate[0].totalPayment) : 0;

    aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PURCHASE } },
      { $group: { _id: "$supplierId", totalPurchases: { $sum: "$amount" } } }
    ]);
    supplierUpdate.totalPurchases = aggregate.length ? aggregate[0].totalPurchases : 0;

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
      grn,
      supplier,
      itemsNotUpdated,
      deleteAccountTxnId: Number(req.body.payOrCredit) === payOrCreditOptions.ON_CREDIT && accountPaymentTxn ? accountPaymentTxn._id : null,
      addAccountTxn: Number(req.body.payOrCredit) === payOrCreditOptions.ON_CREDIT || haveOldAccountTxn ?  null : accountPaymentTxn, //pay now and old txn, don't add new txn
      updateAccountTxn: Number(req.body.payOrCredit) === payOrCreditOptions.ON_CREDIT || !haveOldAccountTxn ?  null : accountPaymentTxn, // pay now and don't have old txn, don't update txn
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
    if(!req.body.grnId) throw new Error("GRN ID is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    
    const grn = await GRN.findOne({ _id: req.body.grnId, storeId: req.body.storeId});
    if(!grn) throw new Error("invalid Request");
    if(store.lastEndOfDay && moment(grn.grnDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete GRN done before last end of day");

    let anyFutureGRNofItems = false;//if any item of this GRN was purchased after this GRN, the block delete
    for(let index = 0; index < grn.items.length; index++)
    {
      let item =  grn.items[index];
      let conditions = {
        storeId: req.body.storeId,
        creationDate: { $gt: grn.creationDate  }, //get grns created after this GRN
      }
      if(item.parentId) //this item was purchased in pack, find if any units, this pack or any other pack of this item are purchased after this
      {
        conditions['$or'] = [{ "items._id" : item.parentId }, { "items.parentId": item.parentId }];
      }else //this item was purchased in units, find if any units, this pack or any other pack of this item are purchased after this
      {
        conditions['$or'] = [{ "items._id" : item._id }, { "items.parentId": item._id }];
      }
      let futureGrn = await GRN.findOne(conditions);
      if(futureGrn)
      {
        anyFutureGRNofItems = true;
        break;
      }
    }

    if(anyFutureGRNofItems)
      throw new Error("This GRN contains some items that were also purchased after this GRN so this GRN cannot be deleted");
    const rtvs = await RTV.find({ storeId: req.body.storeId, grnId: req.body.grnId });
    if(rtvs && rtvs.length > 0)
      throw new Error("There is an RTV against this GRN, so it cannot be deleted");

    const now = moment().tz('Asia/Karachi').toDate();
    if(grn.poId)
    {
      await PurchaseOrder.findByIdAndUpdate(grn.poId, { status: poStates.PO_STATUS_OPEN, lastUpdated: now });
    }

    let dbItem = null;
    let parentItem = null;
    for(let index = 0; index < grn.items.length; index++)
    {
      let item =  grn.items[index];
      let baseItemId = item.parentId ? item.parentId : item._id;
      await StockTransactions.deleteMany({
        storeId: store._id,
        grnId: grn._id,
        itemId: baseItemId,
        packId: item.parentId ? item._id : null
      });

      let aggregate = await StockTransactions.aggregate([
        { $match: { storeId: store._id, itemId: baseItemId} },
        { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
      ]);
      let currentStock = aggregate.length ? aggregate[0].currentStock : 0;
      await Item.findByIdAndUpdate(baseItemId, { currentStock, costPrice: item.prevCostPrice, salePrice: item.prevSalePrice, lastUpdated: now }); //revert old cost and sale price
      await Item.updateMany({ packParentId: baseItemId }, { currentStock, costPrice: item.prevCostPrice, salePrice: item.prevSalePrice, lastUpdated: now }); //update old cost and current stock in all packings 
      if(item.parentId) //update pack sale of this specific packing
        await Item.findByIdAndUpdate(item._id, { packSalePrice: item.prevPackSalePrice,  lastUpdated: now });
      
      dbItem = await Item.findById(item._id);
      if(!dbItem) continue;
      parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;
      await removeBatchStock(dbItem, item, now, parentItem);
    }

    let supplier = await Supplier.findById(grn.supplierId);

    let supplierUpdate = {
      totalPayment: supplier.totalPayment,
      totalPurchases: +(supplier.totalPurchases - grn.totalAmount).toFixed(2),
      currentBalance: +(supplier.currentBalance - grn.totalAmount).toFixed(2),
      lastUpdated: now,
    }
    let grnPaymentTxn = await SupplierLedger.findOne({ storeId: req.body.storeId, grnId: req.body.grnId, type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT });
    let accountTxn = null;
    if(grnPaymentTxn)
    {
      supplierUpdate.totalPayment = +(supplier.totalPayment - grn.totalAmount).toFixed(2);
      supplierUpdate.currentBalance = supplier.currentBalance; //current Balance doesn't change
      accountTxn = await AccountTransaction.findOne({ storeId: req.body.storeId, parentId: grnPaymentTxn._id });
      await AccountTransaction.findOneAndDelete({ storeId: req.body.storeId, parentId: grnPaymentTxn._id });
    }

    await SupplierLedger.deleteMany({ storeId: req.body.storeId, grnId: req.body.grnId });
    await GRN.findOneAndDelete({ _id: req.body.grnId, storeId: req.body.storeId });
    
    const lastAction = store.dataUpdated.suppliers;
    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    await store.logCollectionLastUpdated('items', now);

    res.json( { 
      success: true,
      supplier,
      accountTxnId: accountTxn ? accountTxn._id : null,
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
       conditions.grnDate = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await GRN.countDocuments(conditions);
    
    const grns = await GRN.find(conditions, null, { skip, limit: recordsPerPage, sort : { creationDate: -1 }  });

    res.json({
      grns,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


router.get('/', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");
    if(!req.query.supplierId) throw new Error("supplierId id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.query.storeId,
      supplierId: req.query.supplierId
    }
    if(req.query.grnId)
      conditions._id = req.query.grnId;
    const grns = await GRN.find(conditions, null, { sort : { creationDate: -1 }  });
    if(req.query.grnId)
      res.json({ grn:  grns.length ? grns[0] : null });
    else
      res.json({ grns });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;