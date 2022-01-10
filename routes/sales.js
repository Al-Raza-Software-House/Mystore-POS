const router = require('express').Router();
const Store = require('../models/store/Store');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const { paymentModes, customerTxns } = require( '../utils/constants' );
const GRN = require( '../models/purchase/GRN' );
const { addBatchStock, removeBatchStock, autoRemoveBatchStock } = require( '../utils' );
const AccountTransaction = require( '../models/accounts/AccountTransaction' );
const StockTransactions = require( '../models/stock/StockTransactions' );
const Item = require( '../models/stock/Item' );
const Sale = require( '../models/sale/Sale' );
const SaleItem = require( '../models/sale/SaleItem' );
const CustomerLedger = require( '../models/parties/CustomerLedger' );
const Customer = require( '../models/parties/Customer' );

router.use(authCheck);

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      storeId: req.body.storeId,
      userId: req.body.userId,
      customerId: req.body.customerId ? req.body.customerId : null,
      registorId: store.registors[0]._id,
      saleNumber: req.body.saleNumber,
      isVoided: req.body.isVoided,

      totalItems: 0,
      totalQuantity: 0,
      totalDiscount: 0,
      totalCost: 0,
      totalAmount: 0,

      adjustment: isNaN(req.body.adjustment) ? 0 : Number(req.body.adjustment),
      profit: 0,

      cashPaid: isNaN(req.body.cashPaid) ? 0 : Number(req.body.cashPaid),
      creditAmount: isNaN(req.body.creditAmount) ? 0 : Number(req.body.creditAmount),
      bankAmount: isNaN(req.body.bankAmount) ? 0 : Number(req.body.bankAmount),
      cashAmount: 0, // actual cash charged to customer
      balanceAmount: 0, //cash returned to customer

      

      bankId:  Number(req.body.bankAmount) !== 0  ? req.body.bankId : null,
      chequeTxnId:  Number(req.body.bankAmount) !== 0  ? req.body.chequeTxnId : "",
          
      notes: req.body.notes ? req.body.notes : "",

      saleDate: req.body.saleDate ? moment(req.body.saleDate).tz('Asia/Karachi').toDate() : null,
      creationDate: req.body.creationDate ? moment(req.body.creationDate).tz('Asia/Karachi').toDate() : now,
      lastUpdated: req.body.lastUpdated ? moment(req.body.lastUpdated).tz('Asia/Karachi').toDate() : now,
    }
    let items = req.body.items ? req.body.items : [];

    items.forEach(item => {
      record.totalItems++;
      if(item.isVoided) return;
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      if(quantity === 0) return;
      record.totalQuantity += quantity;

      let discount = isNaN(item.discount) ? 0 :  Number(item.discount);
      record.totalDiscount += quantity * discount;
      
      let salePrice = isNaN(item.salePrice) ? 0 : Number(item.salePrice);
      record.totalAmount += salePrice * quantity;
      record.totalAmount -= quantity * discount;
    });

    record.totalAmount += isNaN(req.body.adjustment) ? 0 : Number(req.body.adjustment);

    record.totalQuantity = +record.totalQuantity.toFixed(2);
    record.totalAmount = +record.totalAmount.toFixed(2);
    record.totalDiscount = +record.totalDiscount.toFixed(2);

    record.balanceAmount = (record.cashPaid + record.creditAmount + record.bankAmount) - record.totalAmount;
    record.cashAmount = record.totalAmount - (record.creditAmount + record.bankAmount); //after credit and bank, rest is paid in cash
    record.balanceAmount = +record.balanceAmount.toFixed(2);
    record.cashAmount = +record.cashAmount.toFixed(2);

    let sale = new Sale(record);
    await sale.save();

    let parentItem = null;
    let dbItem = null;
    let formItem = null;
    for(let index = 0; index < items.length; index++)
    {
      formItem = items[index];
      dbItem = await Item.findById(formItem._id);
      if(!dbItem) continue;
      parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;
      
      let costPrice = dbItem.packParentId ? dbItem.packQuantity * parentItem.costPrice : dbItem.costPrice;

      let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
      let discount = isNaN(formItem.discount) ? 0 :  Number(formItem.discount);
      let salePrice = isNaN(formItem.salePrice) ? 0 : Number(formItem.salePrice);
      
      let totalProfit = (quantity * salePrice) - (quantity * costPrice) - (quantity * discount);

      let batches = [];
      if(quantity > 0 && formItem.batches && formItem.batches.length !== 0)
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
      else if(quantity < 0 && formItem.batches && formItem.batches.length !== 0)
        formItem.batches.forEach(batch => {
          if(!batch.batchNumber || !batch.batchExpiryDate || batch.batchQuantity === 0) return;
          batches.push({
            batchNumber: batch.batchNumber,
            batchExpiryDate: batch.batchExpiryDate,
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });

      let saleItem = {
        storeId: store._id,
        saleId: sale._id,
        itemId: formItem._id, //can be pack or parent
        parentId: dbItem.packParentId ? dbItem.packParentId : null, //always parent id if pack, used to diff pack/unit sale
        baseItemId: dbItem.packParentId ? dbItem.packParentId : dbItem._id, //always unit item
        categoryId: dbItem.categoryId,
        isVoided: formItem.isVoided,
        quantity,
        costPrice: +costPrice.toFixed(2),
        salePrice,
        discount,
        totalProfit: +totalProfit.toFixed(2),
        batches,
        time: sale.saleDate
      }
      let dbSaleItem = new SaleItem(saleItem);
      await dbSaleItem.save();

      if(formItem.isVoided || quantity === 0) continue;
      
      sale.totalCost += quantity * costPrice;
      

      await new StockTransactions({
        storeId: store._id,
        userId: sale.userId,
        itemId: parentItem ? parentItem._id : dbItem._id,
        categoryId: dbItem.categoryId,
        packId: parentItem ? dbItem._id : null,
        saleId: sale._id,
        grnId: null,
        rtvId: null,
        reasonId: null,
        quantity: dbItem.isServiceItem ? 0 :  -1 * (parentItem ? quantity * dbItem.packQuantity : quantity),
        batches: formItem.batches,
        notes: "",
        time: sale.creationDate
      }).save();

      if(dbItem.isServiceItem) continue;
      let currentStock = parentItem ? parentItem.currentStock : dbItem.currentStock;
      let newQuantity = parentItem ? quantity * dbItem.packQuantity : quantity;//convert to units if pack

      let itemUpdate = {
        currentStock: currentStock - newQuantity,
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
      if(quantity < 0) //returning stock
        await addBatchStock(dbItem, saleItem, now, parentItem);
      else if(quantity > 0 && saleItem.batches.length > 0) // batches specified when selling
        await removeBatchStock(dbItem, saleItem, now, parentItem);
      else if(quantity > 0 && saleItem.batches.length === 0 && dbItem.batches.length !== 0) // item has batches but batches not specified on POS, auto-deduct stock
        await autoRemoveBatchStock(dbItem, dbSaleItem, now, parentItem);
    }

    sale.totalCost = +(sale.totalCost).toFixed(2);
    sale.profit = sale.totalAmount - sale.totalCost;
    await sale.save(); //save previous costs

    store.idsCursors.saleCursor = sale.saleNumber + 1;
    await store.save();

    let customer = null;
    let lastAction = store.dataUpdated.customers;
    if(sale.customerId)
    {
      //log Transactions
      record = {
        storeId: sale.storeId,
        userId: sale.userId,
        customerId: sale.customerId,
        saleId: sale._id,
        bankId: null,
        amount: sale.totalAmount,
        type: sale.totalAmount < 0 ? customerTxns.CUSTOMER_TXN_TYPE_RETURN :  customerTxns.CUSTOMER_TXN_TYPE_SALE,
        description: sale.totalAmount < 0 ? "Goods returned" : "Goods sold",
        notes: sale.notes ? sale.notes : "",
        time: sale.creationDate,
        lastUpdated: sale.creationDate
      }
      let ledgerTxn = new CustomerLedger(record);
      await ledgerTxn.save();

      if(sale.cashAmount !== 0)
      {
        record = {
          storeId: sale.storeId,
          userId: sale.userId,
          customerId: sale.customerId,
          saleId: sale._id,
          bankId: null,
          amount: -1 * sale.cashAmount,
          type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT,
          description: "Amount paid with sale",
          notes: sale.notes ? sale.notes : "",
          time: sale.creationDate,
          lastUpdated: sale.creationDate
        }
        ledgerTxn = new CustomerLedger(record);
        await ledgerTxn.save();
      }

      if(sale.bankAmount !== 0)
      {
        record = {
          storeId: sale.storeId,
          userId: sale.userId,
          customerId: sale.customerId,
          saleId: sale._id,
          bankId: sale.bankId,
          amount: -1 * sale.bankAmount,
          type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT,
          description: "Amount paid with sale",
          notes: sale.notes ? sale.notes : "",
          time: sale.creationDate,
          lastUpdated: sale.creationDate
        }
        ledgerTxn = new CustomerLedger(record);
        await ledgerTxn.save();
      }
      customer = await Customer.findOne({ _id: sale.customerId, storeId: sale.storeId});
      let customerUpdate = {
        totalSales: 0,
        totalReturns: 0,
        totalPayment: 0,
        currentBalance: 0,

        lastUpdated: now,
      }
      if(sale.totalAmount > 0)
        customerUpdate.lastSale = sale.creationDate;
      if(sale.cashAmount !== 0 || sale.bankAmount !== 0)
        customerUpdate.lastPayment = sale.creationDate;

      let aggregate = await CustomerLedger.aggregate([
            { $match: { storeId: sale.storeId, customerId: sale.customerId } },
            { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
          ]);
      aggregate.forEach(record => {
        if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_SALE)
          customerUpdate.totalSales = record.totalAmount;
        else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_RETURN)
          customerUpdate.totalReturns = -1 * record.totalAmount;
        else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_PAYMENT)
          customerUpdate.totalPayment = -1 * record.totalAmount;
      });

      aggregate = await CustomerLedger.aggregate([
        { $match: { storeId: sale.storeId, customerId: sale.customerId } },
        { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
      ]);

      customerUpdate.currentBalance = customer.openingBalance + aggregate[0].currentBalance;

      customer.set(customerUpdate);
      await customer.save();
      await store.logCollectionLastUpdated('customers', now);
    }
    
    let accountTxns = [];
    if(sale.cashAmount !== 0)
    {
      let description = sale.cashAmount < 0 ? "Items returned" : "Cash sales";
      if(customer)  description += ", customer: "+ customer.name;
      record = {
        storeId: sale.storeId,
        userId: sale.userId,
        parentId: sale._id,
        headId: store.accountHeadIds.Sales,
        bankId: null,
        amount: sale.cashAmount,
        type: paymentModes.PAYMENT_MODE_CASH, //cash or bank
        notes: sale.notes,
        description,
        time: sale.saleDate,
        lastUpdated: sale.saleDate
      }
      let accountCashTxn = new AccountTransaction(record);
      await accountCashTxn.save();
      accountTxns.push(accountCashTxn);
    }

    if(sale.bankAmount !== 0)
    {
      let description = sale.bankAmount < 0 ? "Items returned" : "Bank sales";
      if(customer)  description += ", customer: "+ customer.name;

      record = {
        storeId: sale.storeId,
        userId: sale.userId,
        parentId: sale._id,
        headId: store.accountHeadIds.Sales,
        bankId: sale.bankId,
        amount: sale.bankAmount,
        type: paymentModes.PAYMENT_MODE_BANK, //cash or bank
        notes: sale.notes,
        description,
        time: sale.saleDate,
        lastUpdated: sale.saleDate
      }
      let accountBankTxn = new AccountTransaction(record);
      await accountBankTxn.save();
      accountTxns.push(accountBankTxn);
    }

    sale = sale.toObject();
    let saleItems = await await SaleItem.find({ storeId: sale.storeId, saleId: sale._id  });
    sale.items = [];
    for(let i = 0; i < saleItems.length; i++)
    {
      let itemObj = saleItems[i].toObject();
      itemObj._id = itemObj.itemId;
      sale.items.push(itemObj);
    }

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('items', now);
    res.json({
      sale,
      customer,
      accountTxns,
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
    if(!req.body.saleId) throw new Error("saleId is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    
    let sale = await Sale.findOne({ _id: req.body.saleId, storeId: req.body.storeId});
    if(!sale) throw new Error("invalid Request");

    if(store.lastEndOfDay && moment(sale.saleDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot update Sale done before last end of day");
    
    const now = moment().tz('Asia/Karachi').toDate();
    await voidSale(sale, store.accountHeadIds.Sales, now);
    await SaleItem.deleteMany({ storeId: sale.storeId, saleId: sale._id });
    if(sale.customerId) // may be the customer is removed on update
    {
      await store.logCollectionLastUpdated('customers', now);
    }

    let record = {
      customerId: req.body.customerId ? req.body.customerId : null,
      isVoided: false,

      totalItems: 0,
      totalQuantity: 0,
      totalDiscount: 0,
      totalCost: 0,
      totalAmount: 0,

      adjustment: isNaN(req.body.adjustment) ? 0 : Number(req.body.adjustment),
      profit: 0,

      cashPaid: isNaN(req.body.cashPaid) ? 0 : Number(req.body.cashPaid),
      creditAmount: isNaN(req.body.creditAmount) ? 0 : Number(req.body.creditAmount),
      bankAmount: isNaN(req.body.bankAmount) ? 0 : Number(req.body.bankAmount),
      cashAmount: 0, // actual cash charged to customer
      balanceAmount: 0, //cash returned to customer

      

      bankId:  Number(req.body.bankAmount) !== 0  ? req.body.bankId : null,
      chequeTxnId:  Number(req.body.bankAmount) !== 0  ? req.body.chequeTxnId : "",
          
      notes: req.body.notes ? req.body.notes : "",

      saleDate: req.body.saleDate ? moment(req.body.saleDate).tz('Asia/Karachi').toDate() : null,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];

    items.forEach(item => {
      record.totalItems++;
      if(item.isVoided) return;
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      if(quantity === 0) return;
      record.totalQuantity += quantity;

      let discount = isNaN(item.discount) ? 0 :  Number(item.discount);
      record.totalDiscount += quantity * discount;
      
      let salePrice = isNaN(item.salePrice) ? 0 : Number(item.salePrice);
      record.totalAmount += salePrice * quantity;
      record.totalAmount -= quantity * discount;
    });

    record.totalAmount += isNaN(req.body.adjustment) ? 0 : Number(req.body.adjustment);

    record.totalQuantity = +record.totalQuantity.toFixed(2);
    record.totalAmount = +record.totalAmount.toFixed(2);
    record.totalDiscount = +record.totalDiscount.toFixed(2);

    record.balanceAmount = (record.cashPaid + record.creditAmount + record.bankAmount) - record.totalAmount;
    record.cashAmount = record.totalAmount - (record.creditAmount + record.bankAmount); //after credit and bank, rest is paid in cash
    record.balanceAmount = +record.balanceAmount.toFixed(2);
    record.cashAmount = +record.cashAmount.toFixed(2);

    sale.set(record);
    await sale.save();

    let parentItem = null;
    let dbItem = null;
    let formItem = null;
    for(let index = 0; index < items.length; index++)
    {
      formItem = items[index];
      dbItem = await Item.findById(formItem._id);
      if(!dbItem) continue;
      parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;
      
      let costPrice = dbItem.packParentId ? dbItem.packQuantity * parentItem.costPrice : dbItem.costPrice;

      let quantity = isNaN(formItem.quantity) ? 0 : Number(formItem.quantity);
      let discount = isNaN(formItem.discount) ? 0 :  Number(formItem.discount);
      let salePrice = isNaN(formItem.salePrice) ? 0 : Number(formItem.salePrice);
      
      let totalProfit = (quantity * salePrice) - (quantity * costPrice) - (quantity * discount);

      let batches = [];
      if(quantity > 0 && formItem.batches && formItem.batches.length !== 0)
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
      else if(quantity < 0 && formItem.batches && formItem.batches.length !== 0)
        formItem.batches.forEach(batch => {
          if(!batch.batchNumber || !batch.batchExpiryDate || batch.batchQuantity === 0) return;
          batches.push({
            batchNumber: batch.batchNumber,
            batchExpiryDate: batch.batchExpiryDate,
            batchQuantity: +Number(batch.batchQuantity).toFixed(2)
          })
        });

      let saleItem = {
        storeId: store._id,
        saleId: sale._id,
        itemId: formItem._id, //can be pack or parent
        parentId: dbItem.packParentId ? dbItem.packParentId : null, //always parent id if pack, used to diff pack/unit sale
        baseItemId: dbItem.packParentId ? dbItem.packParentId : dbItem._id, //always unit item
        categoryId: dbItem.categoryId,
        isVoided: formItem.isVoided,
        quantity,
        costPrice: +costPrice.toFixed(2),
        salePrice,
        discount,
        totalProfit: +totalProfit.toFixed(2),
        batches,
        time: sale.saleDate
      }
      let dbSaleItem = new SaleItem(saleItem);
      await dbSaleItem.save();

      if(formItem.isVoided) continue;
      
      sale.totalCost += quantity * costPrice;
    }

    sale.totalCost = +(sale.totalCost).toFixed(2);
    sale.profit = sale.totalAmount - sale.totalCost;
    await sale.save(); //save previous costs
    
    await unVoidSale(sale, store.accountHeadIds.Sales, now);

    sale = await Sale.findOne({ _id: req.body.saleId, storeId: req.body.storeId});
    let customer = null;
    const lastAction = store.dataUpdated.customers;
    if(sale.customerId)
    {
      customer = await Customer.findById(sale.customerId);
      await store.logCollectionLastUpdated('customers', now);
    }
    let accountTxns = await AccountTransaction.find({ storeId: store._id, parentId: sale._id, headId: store.accountHeadIds.Sales });
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('items', now);

    sale = sale.toObject();
    let saleItems = await await SaleItem.find({ storeId: sale.storeId, saleId: sale._id  });
    sale.items = [];
    for(let i = 0; i < saleItems.length; i++)
    {
      let itemObj = saleItems[i].toObject();
      itemObj._id = itemObj.itemId;
      sale.items.push(itemObj);
    }
    
    res.json({ 
      sale,
      customer,
      accountTxns,
      now,
      lastAction 
    });

  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//remove stock txn, reverse batch txn, remove account txn, remove customer ledger txns, 
const voidSale = async (sale, salesHeadId, now) => {
  let dbItem = null;
  let parentItem = null;
  let items = await SaleItem.find({ storeId: sale.storeId, saleId: sale._id });
  for(let index = 0; index < items.length; index++)
  {
    let saleItem =  items[index];
    let baseItemId = saleItem.baseItemId;
    await StockTransactions.deleteMany({
      storeId: sale.storeId,
      saleId: sale._id,
      itemId: baseItemId,
      packId: saleItem.parentId ? saleItem.itemId : null
    });

    let aggregate = await StockTransactions.aggregate([
      { $match: { storeId: sale.storeId, itemId: baseItemId} },
      { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
    ]);
    let currentStock = aggregate.length ? aggregate[0].currentStock : 0;
    await Item.findByIdAndUpdate(baseItemId, { currentStock, lastUpdated: now }); //revert old cost and sale price
    await Item.updateMany({ packParentId: baseItemId }, { currentStock, lastUpdated: now }); //update old cost and current stock in all packings 
    
    dbItem = await Item.findById(saleItem.itemId);
    if(!dbItem) continue;
    parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;
    if(saleItem.quantity < 0) //returning stock
      await removeBatchStock(dbItem, saleItem, now, parentItem);
    else if(saleItem.quantity > 0) // batches specified when selling
      await addBatchStock(dbItem, saleItem, now, parentItem);
  }

  if(sale.customerId)
  {
    await CustomerLedger.deleteMany({ storeId: sale.storeId, customerId: sale.customerId, saleId: sale._id });
    
    let customer = await Customer.findOne({ _id: sale.customerId, storeId: sale.storeId});
      let customerUpdate = {
        totalSales: 0,
        totalReturns: 0,
        totalPayment: 0,
        currentBalance: 0,
        lastUpdated: now,
      }
      
      let aggregate = await CustomerLedger.aggregate([
            { $match: { storeId: sale.storeId, customerId: sale.customerId } },
            { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
          ]);
      aggregate.forEach(record => {
        if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_SALE)
          customerUpdate.totalSales = record.totalAmount;
        else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_RETURN)
          customerUpdate.totalReturns = -1 * record.totalAmount;
        else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_PAYMENT)
          customerUpdate.totalPayment = -1 * record.totalAmount;
      });

      aggregate = await CustomerLedger.aggregate([
        { $match: { storeId: sale.storeId, customerId: sale.customerId } },
        { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
      ]);

      customerUpdate.currentBalance = customer.openingBalance + (aggregate.length ? aggregate[0].currentBalance : 0);

      customer.set(customerUpdate);
      await customer.save();
  }

  await AccountTransaction.deleteMany({ storeId: sale.storeId, parentId: sale._id, headId: salesHeadId });
  sale.isVoided = true;
  await sale.save();
}

//remove stock txn, reverse batch txn, remove account txn, remove customer ledger txns, 
const unVoidSale = async (sale, salesHeadId, now) => {
  let dbItem = null;
  let parentItem = null;
  let items = await SaleItem.find({ storeId: sale.storeId, saleId: sale._id });
  for(let index = 0; index < items.length; index++)
  {
    let saleItem =  items[index];
    dbItem = await Item.findById(saleItem.itemId);
    if(!dbItem) continue;
    parentItem = dbItem.packParentId ? await Item.findById(dbItem.packParentId) : null;

    if(saleItem.isVoided || saleItem.quantity === 0) continue;

    await new StockTransactions({
      storeId: sale.storeId,
      userId: sale.userId,
      itemId: parentItem ? parentItem._id : dbItem._id,
      categoryId: dbItem.categoryId,
      packId: parentItem ? dbItem._id : null,
      saleId: sale._id,
      grnId: null,
      rtvId: null,
      reasonId: null,
      quantity: dbItem.isServiceItem ? 0 :  -1 * (parentItem ? saleItem.quantity * dbItem.packQuantity : saleItem.quantity),
      batches: saleItem.batches,
      notes: "",
      time: sale.creationDate
    }).save();

    if(dbItem.isServiceItem) continue;
    let aggregate = await StockTransactions.aggregate([
      { $match: { storeId: sale.storeId, itemId: saleItem.baseItemId} },
      { $group: { _id: "$itemId", currentStock: { $sum: "$quantity" } } }
    ]);
    let currentStock = aggregate.length ? aggregate[0].currentStock : 0;
    await Item.findByIdAndUpdate(saleItem.baseItemId, { currentStock, lastUpdated: now }); //revert old cost and sale price
    await Item.updateMany({ packParentId: saleItem.baseItemId }, { currentStock, lastUpdated: now }); //update old cost and current stock in all packings 
    
    if(saleItem.quantity < 0) //returning stock
      await addBatchStock(dbItem, saleItem, now, parentItem);
    else if(saleItem.quantity > 0 && saleItem.batches.length > 0) // batches specified when selling
      await removeBatchStock(dbItem, saleItem, now, parentItem);
    else if(saleItem.quantity > 0 && saleItem.batches.length === 0 && dbItem.batches.length !== 0) // item has batches but batches not specified on POS, auto-deduct stock
      await autoRemoveBatchStock(dbItem, saleItem, now, parentItem);
  }
  let customer = null;
  if(sale.customerId)
  {
    //log Transactions
    record = {
      storeId: sale.storeId,
      userId: sale.userId,
      customerId: sale.customerId,
      saleId: sale._id,
      bankId: null,
      amount: sale.totalAmount,
      type: sale.totalAmount < 0 ? customerTxns.CUSTOMER_TXN_TYPE_RETURN :  customerTxns.CUSTOMER_TXN_TYPE_SALE,
      description: sale.totalAmount < 0 ? "Goods returned" : "Goods sold",
      notes: sale.notes ? sale.notes : "",
      time: sale.creationDate,
      lastUpdated: sale.creationDate
    }
    let ledgerTxn = new CustomerLedger(record);
    await ledgerTxn.save();

    if(sale.cashAmount !== 0)
    {
      record = {
        storeId: sale.storeId,
        userId: sale.userId,
        customerId: sale.customerId,
        saleId: sale._id,
        bankId: null,
        amount: -1 * sale.cashAmount,
        type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT,
        description: "Amount paid with sale",
        notes: sale.notes ? sale.notes : "",
        time: sale.creationDate,
        lastUpdated: sale.creationDate
      }
      ledgerTxn = new CustomerLedger(record);
      await ledgerTxn.save();
    }

    if(sale.bankAmount !== 0)
    {
      record = {
        storeId: sale.storeId,
        userId: sale.userId,
        customerId: sale.customerId,
        saleId: sale._id,
        bankId: sale.bankId,
        amount: -1 * sale.bankAmount,
        type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT,
        description: "Amount paid with sale",
        notes: sale.notes ? sale.notes : "",
        time: sale.creationDate,
        lastUpdated: sale.creationDate
      }
      ledgerTxn = new CustomerLedger(record);
      await ledgerTxn.save();
    }
    customer = await Customer.findOne({ _id: sale.customerId, storeId: sale.storeId});
    let customerUpdate = {
      totalSales: 0,
      totalReturns: 0,
      totalPayment: 0,
      currentBalance: 0,

      lastUpdated: now,
    }

    let aggregate = await CustomerLedger.aggregate([
          { $match: { storeId: sale.storeId, customerId: sale.customerId } },
          { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
        ]);
    aggregate.forEach(record => {
      if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_SALE)
        customerUpdate.totalSales = record.totalAmount;
      else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_RETURN)
        customerUpdate.totalReturns = -1 * record.totalAmount;
      else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_PAYMENT)
        customerUpdate.totalPayment = -1 * record.totalAmount;
    });

    aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: sale.storeId, customerId: sale.customerId } },
      { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
    ]);

    customerUpdate.currentBalance = customer.openingBalance + aggregate[0].currentBalance;

    customer.set(customerUpdate);
    await customer.save();
  }

  if(sale.cashAmount !== 0)
  {
    let description = sale.cashAmount < 0 ? "Items returned" : "Cash sales";
    if(customer)  description += ", customer: "+ customer.name;
    record = {
      storeId: sale.storeId,
      userId: sale.userId,
      parentId: sale._id,
      headId: salesHeadId,
      bankId: null,
      amount: sale.cashAmount,
      type: paymentModes.PAYMENT_MODE_CASH, //cash or bank
      notes: sale.notes,
      description,
      time: sale.saleDate,
      lastUpdated: sale.saleDate
    }
    let accountCashTxn = new AccountTransaction(record);
    await accountCashTxn.save();
  }

  if(sale.bankAmount !== 0)
  {
    let description = sale.bankAmount < 0 ? "Items returned" : "Bank sales";
    if(customer)  description += ", customer: "+ customer.name;
    record = {
      storeId: sale.storeId,
      userId: sale.userId,
      parentId: sale._id,
      headId: salesHeadId,
      bankId: sale.bankId,
      amount: sale.bankAmount,
      type: paymentModes.PAYMENT_MODE_BANK, //cash or bank
      notes: sale.notes,
      description,
      time: sale.saleDate,
      lastUpdated: sale.saleDate
    }
    let accountBankTxn = new AccountTransaction(record);
    await accountBankTxn.save();
  }
  
  sale.isVoided = false;
  await sale.save();
}

router.post('/toggleVoid', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.saleId) throw new Error("SaleId is required");

    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    
    let sale = await Sale.findOne({ _id: req.body.saleId, storeId: req.body.storeId});
    if(!sale) throw new Error("invalid Request");

    if(store.lastEndOfDay && moment(sale.saleDate) <= moment(store.lastEndOfDay))
      throw new Error(`Cannot ${ sale.isVoided ? "unVoid" : "Void" } sale done before last end of day`);

    const now = moment().tz('Asia/Karachi').toDate();

    if(sale.isVoided === false)
      await voidSale(sale, store.accountHeadIds.Sales, now);
    else if(sale.isVoided)
      await unVoidSale(sale, store.accountHeadIds.Sales, now);

    sale = await Sale.findOne({ _id: req.body.saleId, storeId: req.body.storeId});
    let customer = null;
    const lastAction = store.dataUpdated.customers;
    if(sale.customerId)
    {
      customer = await Customer.findById(sale.customerId);
      await store.logCollectionLastUpdated('customers', now);
    }
    let accountTxns = await AccountTransaction.find({ storeId: store._id, parentId: sale._id, headId: store.accountHeadIds.Sales });
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('items', now);

    sale = sale.toObject();
    let saleItems = await await SaleItem.find({ storeId: sale.storeId, saleId: sale._id  });
    sale.items = [];
    for(let i = 0; i < saleItems.length; i++)
    {
      let itemObj = saleItems[i].toObject();
      itemObj._id = itemObj.itemId;
      sale.items.push(itemObj);
    }
    
    res.json({ 
      sale,
      customer,
      accountTxns,
      now,
      lastAction 
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
    }
    if(req.body.userId)
      conditions.userId = req.body.userId;
    if(req.body.saleNumber)
      conditions.saleNumber = Number(req.body.saleNumber);
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       let startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       let endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.saleDate = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await Sale.countDocuments(conditions);
    
    const sales = await Sale.find(conditions, null, { skip, limit: recordsPerPage, sort : { creationDate: -1 }  });
    let saleObjs = [];
    for(let index = 0; index < sales.length; index++)
    {
      let sale = sales[ index ].toObject();
      let items = await SaleItem.find({ storeId: req.body.storeId, saleId: sale._id });
      sale.items = [];
      for(let i = 0; i < items.length; i++)
      {
        let itemObj = items[i].toObject();
        itemObj._id = itemObj.itemId;
        sale.items.push(itemObj);
      }
      saleObjs.push(sale);
    }
    res.json({
      sales: saleObjs,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;