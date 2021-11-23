const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const AccountTransaction = require( '../models/accounts/AccountTransaction' );
const DeleteActivity = require( '../models/store/DeleteActivity' );
const { supplierTxns, paymentModes } = require( '../utils/constants' );
const SupplierLedger = require( '../models/parties/SupplierLedger' );

router.use(authCheck);

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.name) throw new Error("supplier name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.suppliers;
    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      storeId: req.body.storeId,
      name: req.body.name,

      contactPersonName: req.body.contactPersonName ? req.body.contactPersonName : "",
      mobile: req.body.mobile ? req.body.mobile : "",
      phone1: req.body.phone1 ? req.body.phone1 : "",
      phone2: req.body.phone2 ? req.body.phone2 : "",
      city: req.body.city ? req.body.city : "",
      address: req.body.address ? req.body.address : "",
      
      openingBalance: req.body.openingBalance ? req.body.openingBalance : 0,
      totalPurchases: 0,
      totalReturns: 0,
      totalPayment: 0,
      currentBalance: req.body.openingBalance ? req.body.openingBalance : 0,

      creationDate: now,
      lastUpdated: now,
      lastPayment: null,
      lastPurchase: null,
    }
    const supplier = new Supplier(record);
    await supplier.save();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    res.json({
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
    if(!req.body.name) throw new Error("supplier name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");
    const lastAction = store.dataUpdated.suppliers;
    const now = moment().tz('Asia/Karachi').toDate();

    let currentBalance = supplier.currentBalance;
    if(supplier.openingBalance !== Number(req.body.openingBalance)) //opening balance changed, change current balance
    {
      let aggregate = await SupplierLedger.aggregate([
        { $match: { storeId: store._id, supplierId: supplier._id } },
        { $group: { _id: "$supplierId", currentBalance: { $sum: "$amount" } } }
      ]);
      currentBalance = Number(req.body.openingBalance) + (aggregate.length ? aggregate[0].currentBalance : 0);
    }
    let record = {
      name: req.body.name,

      contactPersonName: req.body.contactPersonName ? req.body.contactPersonName : "",
      mobile: req.body.mobile ? req.body.mobile : "",
      phone1: req.body.phone1 ? req.body.phone1 : "",
      phone2: req.body.phone2 ? req.body.phone2 : "",
      city: req.body.city ? req.body.city : "",
      address: req.body.address ? req.body.address : "",
      openingBalance: req.body.openingBalance ? req.body.openingBalance : 0,
      currentBalance,
      lastUpdated: now,
    }
    supplier.set(record);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    res.json({
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
    if(!req.body.supplierId) throw new Error("supplierId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.deleteActivity;
    const txns = await SupplierLedger.countDocuments({ storeId: req.body.storeId, supplierId: req.body.supplierId });
    if(txns) throw new Error("This supplier has transaction in the system so it connot be deleted");

    await Supplier.findOneAndDelete({ _id: req.body.supplierId, storeId: req.body.storeId });
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    await new DeleteActivity({ 
      storeId: req.body.storeId,
      recordId: req.body.supplierId,
      collectionName: 'suppliers',
      time: now
     }).save();
    await store.logCollectionLastUpdated('deleteActivity', now);
    res.json( { success: true, now, lastAction } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/', async (req, res) => {
  try{
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    await store.updateLastVisited();

    const skip = parseInt(req.query.skip ? req.query.skip : 0);
    const recordsPerPage = process.env.MASTER_DATA_RECORDS_PER_PAGE;
    const conditions = {
      storeId: store._id
    }
    if(req.query.after)
    {
      conditions.lastUpdated = {
        $gt: moment(req.query.after).toDate()
      }
    }
    let suppliers = [];
    let hasMoreRecords = false;
    const totalRecords = await Supplier.countDocuments(conditions);
    if(skip < totalRecords)
    {
      suppliers = await Supplier.find(conditions, null, { skip, limit: parseInt(recordsPerPage), sort : { creationDate: -1 } });
      if((skip + suppliers.length) < totalRecords )
        hasMoreRecords = true;
    }

    res.json({
      suppliers,
      totalRecords,
      hasMoreRecords
    })

  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/makePayment', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.amount) throw new Error("amount is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(req.body.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot add transaction before last end of day");

    const lastAction = store.dataUpdated.suppliers;
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      supplierId: req.body.supplierId,
      grnId: null,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: parseInt(req.body.payOrRecieve) * Number(req.body.amount),
      type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT,
      description: parseInt(req.body.payOrRecieve) < 0 ? "Amount paid" : "Amount received",
      notes: req.body.notes,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    const ledgerTxn = new SupplierLedger(record);
    await ledgerTxn.save();

    const accountRecord = {
      storeId: req.body.storeId,
      userId: req.user._id,
      parentId: ledgerTxn._id,
      headId: store.accountHeadIds.SupplierPayment,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: parseInt(req.body.payOrRecieve) * Number(req.body.amount),
      type: parseInt(req.body.type), //cash or bank
      notes: req.body.notes,
      description: (parseInt(req.body.payOrRecieve) < 0 ? "Amount paid to supplier: " : "Amount received from supplier: ") + supplier.name,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    const accountTxn = new AccountTransaction(accountRecord);
    await accountTxn.save();

    let aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$supplierId", totalPayment: { $sum: "$amount" } } }
    ]);
    let supplierUpdate = {
      totalPayment: aggregate.length ? -1 * (aggregate[0].totalPayment) : 0, //Payments are stored in -ve, make it postive
      currentBalance: supplier.openingBalance,
      lastUpdated: now,
      lastPayment: now
    }

    aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id } },
      { $group: { _id: "$supplierId", currentBalance: { $sum: "$amount" } } }
    ]);
    supplierUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    res.json({
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

router.post('/updatePayment', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.txnId) throw new Error("txnId is required");
    if(!req.body.amount) throw new Error("amount is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");
    
    const ledgerTxn = await SupplierLedger.findOne({ _id: req.body.txnId, supplierId: req.body.supplierId, storeId: req.body.storeId });
    if(!ledgerTxn) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(ledgerTxn.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot update transaction done before last end of day");

    const accountTxn = await AccountTransaction.findOne({ parentId: req.body.txnId, headId: store.accountHeadIds.SupplierPayment, storeId: req.body.storeId });
    if(!accountTxn) throw new Error("invalid request");

    const lastAction = store.dataUpdated.suppliers;
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      userId: req.user._id,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: parseInt(req.body.payOrRecieve) * Number(req.body.amount),
      type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT,
      description: parseInt(req.body.payOrRecieve) < 0 ? "Amount paid" : "Amount received",
      notes: req.body.notes,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    ledgerTxn.set(record);
    await ledgerTxn.save();

    const accountRecord = {
      userId: req.user._id,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: parseInt(req.body.payOrRecieve) * Number(req.body.amount),
      type: parseInt(req.body.type), //cash or bank
      notes: req.body.notes,
      description: (parseInt(req.body.payOrRecieve) < 0 ? "Amount paid to supplier: " : "Amount received from supplier: ") + supplier.name,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    accountTxn.set(accountRecord);
    await accountTxn.save();

    let aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$supplierId", totalPayment: { $sum: "$amount" } } }
    ]);
    let supplierUpdate = {
      totalPayment: aggregate.length ? -1 * (aggregate[0].totalPayment) : 0, //Payments are stored in -ve, make it postive
      currentBalance: supplier.openingBalance,
      lastUpdated: now
    }

    aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id } },
      { $group: { _id: "$supplierId", currentBalance: { $sum: "$amount" } } }
    ]);
    supplierUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);
    res.json({
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

router.post('/ledger', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");

    const conditions = {
      storeId: req.body.storeId,
      supplierId: req.body.supplierId
    }
    let startMoment = null;
    let endMoment = null;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.time = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await SupplierLedger.countDocuments(conditions);
    
    const txns = await SupplierLedger.find(conditions, null, { skip, limit: recordsPerPage, sort : { time: 1 }  });
    //opening balance before, selected date
    let aggregateConditions = { storeId: store._id, supplierId: supplier._id };
    if(startMoment)
      aggregateConditions.time = { $lt: startMoment };
    let aggregate = await SupplierLedger.aggregate([
      { $match: aggregateConditions },
      { $group: { _id: "$supplierId", openingBalance: { $sum: "$amount" } } }
    ]);

    const stats = {
      totalRecords,
      openingBalance: aggregate.length ? supplier.openingBalance + aggregate[0].openingBalance : supplier.openingBalance,
      totalPurchases: 0,
      totalReturns: 0,
      totalPayment: 0,
      netBalance: 0,
    }
    if(startMoment && endMoment)
      aggregateConditions.time = { $gte: startMoment, $lte: endMoment };
    //find total purchases, returns, payments in the selected period
    aggregate = await SupplierLedger.aggregate([
        { $match: aggregateConditions },
        { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
      ]);
    aggregate.forEach(record => {
      if(parseInt(record._id) === supplierTxns.SUPPLIER_TXN_TYPE_PURCHASE)
        stats.totalPurchases = record.totalAmount;
      else if(parseInt(record._id) === supplierTxns.SUPPLIER_TXN_TYPE_RETURN)
        stats.totalReturns = -1 * record.totalAmount;
      else if(parseInt(record._id) === supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT)
        stats.totalPayment = -1 * record.totalAmount;
    })
    stats.netBalance = (stats.openingBalance + stats.totalPurchases) - (stats.totalReturns + stats.totalPayment);
    res.json({
      txns,
      stats
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/deletePayment', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.txnId) throw new Error("txnId is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const lastAction = store.dataUpdated.suppliers;
    const now = moment().tz('Asia/Karachi').toDate();

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");

    const ledgerTxn = await SupplierLedger.findOne({ _id: req.body.txnId, supplierId: req.body.supplierId, storeId: req.body.storeId });
    if(!ledgerTxn) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(ledgerTxn.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete transaction done before last end of day");

    const accountTxn = await AccountTransaction.findOne({ parentId: req.body.txnId, headId: store.accountHeadIds.SupplierPayment, storeId: req.body.storeId });
    if(!accountTxn) throw new Error("invalid request");

    await SupplierLedger.findOneAndDelete({ _id: req.body.txnId, supplierId: req.body.supplierId, storeId: req.body.storeId });
    await AccountTransaction.findOneAndDelete({ parentId: req.body.txnId, headId: store.accountHeadIds.SupplierPayment, storeId: req.body.storeId });
    
    let aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id, type: supplierTxns.SUPPLIER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$supplierId", totalPayment: { $sum: "$amount" } } }
    ]);
    let supplierUpdate = {
      totalPayment: aggregate.length ? -1 * (aggregate[0].totalPayment) : 0, //Payments are stored in -ve, make it postive
      currentBalance: supplier.openingBalance,
      lastUpdated: now,
    }

    aggregate = await SupplierLedger.aggregate([
      { $match: { storeId: store._id, supplierId: supplier._id } },
      { $group: { _id: "$supplierId", currentBalance: { $sum: "$amount" } } }
    ]);
    supplierUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    supplier.set(supplierUpdate);
    await supplier.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers', now);

    res.json( { 
      supplier,
      now,
      lastAction,
      accountTxnId: accountTxn._id 
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//to edit ledger transaction
router.get('/transaction', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");
    if(!req.query.supplierId) throw new Error("supplierId is required");
    if(!req.query.txnId) throw new Error("txnId is required");

    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const ledgerTxn = await SupplierLedger.findOne({ _id: req.query.txnId, supplierId: req.query.supplierId, storeId: req.query.storeId });
    await store.updateLastVisited();
    res.json( ledgerTxn );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;