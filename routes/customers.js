const router = require('express').Router();
const Store = require('../models/store/Store');
const Customer = require('../models/parties/Customer');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const DeleteActivity = require( '../models/store/DeleteActivity' );
const CustomerLedger = require( '../models/parties/CustomerLedger' );
const AccountTransaction = require( '../models/accounts/AccountTransaction' );
const { customerTxns, paymentModes } = require( '../utils/constants' );

router.use(authCheck);

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.name) throw new Error("customer name is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    if(req.body.mobile)
    {
      let isMobileExist = await Customer.findOne({ storeId: req.body.storeId, mobile: req.body.mobile });
      if(isMobileExist) throw new Error("This Mobile number is already registered with a customer: "+ isMobileExist.name);
    }
    const lastAction = store.dataUpdated.customers;
    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      storeId: req.body.storeId,
      name: req.body.name,
      mobile: req.body.mobile ? req.body.mobile : "",
      allowCredit: req.body.allowCredit ? req.body.allowCredit : false,
      creditLimit: req.body.creditLimit ? req.body.creditLimit : 0,
      openingBalance: req.body.openingBalance ? req.body.openingBalance : 0,
      totalSales: 0,
      totalReturns: 0,
      totalPayment: 0,
      currentBalance: req.body.openingBalance ? req.body.openingBalance : 0,
      
      city: req.body.city ? req.body.city : "",
      address: req.body.address ? req.body.address : "",
      notes: req.body.notes ? req.body.notes : "",

      creationDate: now,
      lastUpdated: now,
      lastPayment: null,
      lastSale: null,
    }
    const customer = new Customer(record);
    await customer.save();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('customers');
    res.json({
      customer,
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
    if(!req.body.customerId) throw new Error("customerId is required");
    if(!req.body.name) throw new Error("customer name is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    if(req.body.mobile)
    {
      let isMobileExist = await Customer.findOne({ storeId: req.body.storeId, _id: { $ne: req.body.customerId}, mobile: req.body.mobile });
      if(isMobileExist) throw new Error("This Mobile number is already registered with a customer: "+ isMobileExist.name);
    }
    const customer = await Customer.findOne({ _id: req.body.customerId, storeId: req.body.storeId });
    if(!customer) throw new Error("invalid request");

    let currentBalance = customer.currentBalance;
    if(customer.openingBalance !== Number(req.body.openingBalance)) //opening balance changed, change current balance
    {
      let aggregate = await CustomerLedger.aggregate([
        { $match: { storeId: store._id, customerId: customer._id } },
        { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
      ]);
      currentBalance = Number(req.body.openingBalance) + (aggregate.length ? aggregate[0].currentBalance : 0);
    }
    
    const lastAction = store.dataUpdated.customers;
    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      name: req.body.name,
      mobile: req.body.mobile ? req.body.mobile : "",
      allowCredit: req.body.allowCredit ? req.body.allowCredit : false,
      creditLimit: req.body.creditLimit ? req.body.creditLimit : 0,
      openingBalance: req.body.openingBalance ? req.body.openingBalance : 0,
      currentBalance,

      city: req.body.city ? req.body.city : "",
      address: req.body.address ? req.body.address : "",
      notes: req.body.notes ? req.body.notes : "",

      lastUpdated: now,
    }

    customer.set(record);
    await customer.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('customers', now);
    res.json({
      customer,
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
    if(!req.body.customerId) throw new Error("customerId is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.deleteActivity;
    const txns = await CustomerLedger.countDocuments({ storeId: req.body.storeId, customerId: req.body.customerId });
    if(txns) throw new Error("This customer has transaction in the system so it connot be deleted");

    await Customer.findOneAndDelete({ _id: req.body.customerId, storeId: req.body.storeId });
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    await new DeleteActivity({ 
      storeId: req.body.storeId,
      recordId: req.body.customerId,
      collectionName: 'customers',
      time: now
     }).save();
    await store.logCollectionLastUpdated('deleteActivity', now);
    res.json( { success: true, now, lastAction } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/isMobileRegistered', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("store id is required");
    if(!req.query.mobile) throw new Error("mobile is required");
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    let conditions = { storeId: req.query.storeId, mobile: req.query.mobile };
    if(req.query.customerId)
      conditions._id = { $ne: req.query.customerId};
    const customer = await Customer.findOne(conditions);
    res.json( {
      taken: customer ? true: false, 
      name: customer ? customer.name : ""
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/', async (req, res) => {
  try{
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
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
    let customers = [];
    let hasMoreRecords = false;
    const totalRecords = await Customer.countDocuments(conditions);
    if(skip < totalRecords)
    {
      customers = await Customer.find(conditions, null, { skip, limit: parseInt(recordsPerPage), sort : { creationDate: -1 } });
      if((skip + customers.length) < totalRecords )
        hasMoreRecords = true;
    }

    res.json({
      customers,
      totalRecords,
      hasMoreRecords
    })

  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


router.post('/receivePayment', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.customerId) throw new Error("customerId is required");
    if(!req.body.amount) throw new Error("amount is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const customer = await Customer.findOne({ _id: req.body.customerId, storeId: req.body.storeId });
    if(!customer) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(req.body.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot add transaction before last end of day");

    const lastAction = store.dataUpdated.customers;
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      customerId: req.body.customerId,
      saleId: null,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: -1 * parseInt(req.body.payOrRecieve) * Number(req.body.amount), //pay = -1, receive = 1
      type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT,
      description: parseInt(req.body.payOrRecieve) < 0 ? "Amount paid" : "Amount received",
      notes: req.body.notes,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    const ledgerTxn = new CustomerLedger(record);
    await ledgerTxn.save();

    const accountRecord = {
      storeId: req.body.storeId,
      userId: req.user._id,
      parentId: ledgerTxn._id,
      headId: store.accountHeadIds.CustomerReceipt,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: parseInt(req.body.payOrRecieve) * Number(req.body.amount),
      type: parseInt(req.body.type), //cash or bank
      notes: req.body.notes,
      description: (parseInt(req.body.payOrRecieve) < 0 ? "Amount paid to customer: " : "Amount received from customer: ") + customer.name,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    const accountTxn = new AccountTransaction(accountRecord);
    await accountTxn.save();

    let aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: store._id, customerId: customer._id, type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$customerId", totalPayment: { $sum: "$amount" } } }
    ]);
    let customerUpdate = {
      totalPayment: aggregate.length ? -1 * (aggregate[0].totalPayment) : 0, //Payments are stored in -ve, make it postive
      currentBalance: customer.openingBalance,
      lastUpdated: now,
      lastPayment: now
    }

    aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: store._id, customerId: customer._id } },
      { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
    ]);
    customerUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    customer.set(customerUpdate);
    await customer.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('customers', now);
    res.json({
      customer,
      accountTxn,
      txn: ledgerTxn,
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
    if(!req.body.customerId) throw new Error("customerId is required");
    if(!req.body.txnId) throw new Error("txnId is required");
    if(!req.body.amount) throw new Error("amount is required");

    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const customer = await Customer.findOne({ _id: req.body.customerId, storeId: req.body.storeId });
    if(!customer) throw new Error("invalid request");
    
    const ledgerTxn = await CustomerLedger.findOne({ _id: req.body.txnId, customerId: req.body.customerId, storeId: req.body.storeId });
    if(!ledgerTxn) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(ledgerTxn.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot update transaction done before last end of day");

    const accountTxn = await AccountTransaction.findOne({ parentId: req.body.txnId, headId: store.accountHeadIds.CustomerReceipt, storeId: req.body.storeId });
    if(!accountTxn) throw new Error("invalid request");

    const lastAction = store.dataUpdated.customers;
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      userId: req.user._id,
      bankId: parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      amount: -1 * parseInt(req.body.payOrRecieve) * Number(req.body.amount),
      type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT,
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
      description: (parseInt(req.body.payOrRecieve) < 0 ? "Amount paid to customer: " : "Amount received from customer: ") + customer.name,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    accountTxn.set(accountRecord);
    await accountTxn.save();

    let aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: store._id, customerId: customer._id, type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$customerId", totalPayment: { $sum: "$amount" } } }
    ]);
    let customerUpdate = {
      totalPayment: aggregate.length ? -1 * (aggregate[0].totalPayment) : 0, //Payments are stored in -ve, make it postive
      currentBalance: customer.openingBalance,
      lastUpdated: now
    }

    aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: store._id, customerId: customer._id } },
      { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
    ]);
    customerUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    customer.set(customerUpdate);
    await customer.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('customers', now);
    res.json({
      customer,
      accountTxn,
      txn: ledgerTxn,
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
    if(!req.body.customerId) throw new Error("customerId is required");

    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const customer = await Customer.findOne({ _id: req.body.customerId, storeId: req.body.storeId });
    if(!customer) throw new Error("invalid request");

    const conditions = {
      storeId: req.body.storeId,
      customerId: req.body.customerId
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
    const totalRecords = await CustomerLedger.countDocuments(conditions);
    
    const txns = await CustomerLedger.find(conditions, null, { skip, limit: recordsPerPage, sort : { time: 1 }  });
    //opening balance before, selected date
    let aggregateConditions = { storeId: store._id, customerId: customer._id };
    if(startMoment)
      aggregateConditions.time = { $lt: startMoment };
    let aggregate = await CustomerLedger.aggregate([
      { $match: aggregateConditions },
      { $group: { _id: "$customerId", openingBalance: { $sum: "$amount" } } }
    ]);

    const stats = {
      totalRecords,
      openingBalance: aggregate.length ? customer.openingBalance + aggregate[0].openingBalance : customer.openingBalance,
      totalSales: 0,
      totalReturns: 0,
      totalPayment: 0,
      netBalance: 0,
    }
    if(startMoment && endMoment)
      aggregateConditions.time = { $gte: startMoment, $lte: endMoment };
    //find total purchases, returns, payments in the selected period
    aggregate = await CustomerLedger.aggregate([
        { $match: aggregateConditions },
        { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
      ]);
    aggregate.forEach(record => {
      if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_SALE)
        stats.totalSales = record.totalAmount;
      else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_RETURN)
        stats.totalReturns = -1 * record.totalAmount;
      else if(parseInt(record._id) === customerTxns.CUSTOMER_TXN_TYPE_PAYMENT)
        stats.totalPayment = -1 * record.totalAmount;
    })
    stats.netBalance = (stats.openingBalance + stats.totalSales) - (stats.totalReturns + stats.totalPayment);
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
    if(!req.body.customerId) throw new Error("customerId is required");
    if(!req.body.txnId) throw new Error("txnId is required");

    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const lastAction = store.dataUpdated.customers;
    const now = moment().tz('Asia/Karachi').toDate();

    const customer = await Customer.findOne({ _id: req.body.customerId, storeId: req.body.storeId });
    if(!customer) throw new Error("invalid request");

    const ledgerTxn = await CustomerLedger.findOne({ _id: req.body.txnId, customerId: req.body.customerId, storeId: req.body.storeId });
    if(!ledgerTxn) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(ledgerTxn.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete transaction done before last end of day");

    const accountTxn = await AccountTransaction.findOne({ parentId: req.body.txnId, headId: store.accountHeadIds.CustomerReceipt, storeId: req.body.storeId });
    if(!accountTxn) throw new Error("invalid request");

    await CustomerLedger.findOneAndDelete({ _id: req.body.txnId, customerId: req.body.customerId, storeId: req.body.storeId });
    await AccountTransaction.findOneAndDelete({ parentId: req.body.txnId, headId: store.accountHeadIds.CustomerReceipt, storeId: req.body.storeId });
    
    let aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: store._id, customerId: customer._id, type: customerTxns.CUSTOMER_TXN_TYPE_PAYMENT } },
      { $group: { _id: "$customerId", totalPayment: { $sum: "$amount" } } }
    ]);
    let customerUpdate = {
      totalPayment: aggregate.length ? -1 * (aggregate[0].totalPayment) : 0, //Payments are stored in -ve, make it postive
      currentBalance: customer.openingBalance,
      lastUpdated: now,
    }

    aggregate = await CustomerLedger.aggregate([
      { $match: { storeId: store._id, customerId: customer._id } },
      { $group: { _id: "$customerId", currentBalance: { $sum: "$amount" } } }
    ]);
    customerUpdate.currentBalance += aggregate.length ? aggregate[0].currentBalance : 0;

    customer.set(customerUpdate);
    await customer.save();

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('customers', now);

    res.json( { 
      customer,
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
    if(!req.query.customerId) throw new Error("customerId is required");
    if(!req.query.txnId) throw new Error("txnId is required");

    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const ledgerTxn = await CustomerLedger.findOne({ _id: req.query.txnId, customerId: req.query.customerId, storeId: req.query.storeId });
    if(!ledgerTxn) throw new Error("invalid request");
    await store.updateLastVisited();
    res.json( ledgerTxn );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;