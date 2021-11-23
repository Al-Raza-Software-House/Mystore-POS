const router = require('express').Router();
const Store = require('../models/store/Store');
const AccountHead = require('../models/accounts/AccountHead');
const Bank = require('../models/accounts/Bank');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const DeleteActivity = require( '../models/store/DeleteActivity' );
const { accountHeadTypes, paymentModes } = require( '../utils/constants' );
const AccountTransaction = require( '../models/accounts/AccountTransaction' );

router.use(authCheck);


//Manage Bank accounts
router.get('/banks', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const banks = await Bank.find({ storeId: store._id }, null, { sort: { creationDate: -1 } });
    res.json( banks );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/banks/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.name) throw new Error("bank name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.banks;
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    if(req.body.default) //if default bank
    {
      await Bank.updateMany({}, { default: false}); //if this is selected as default, change other bank default status off 
    }
    const bank = new Bank({
      storeId: req.body.storeId,
      name: req.body.name,
      notes: req.body.notes,
      default: req.body.default,
      creationDate: now,
      lastUpdated: now,
      lastTransaction: null
    });
    await bank.save();
    await store.logCollectionLastUpdated('banks', now);
    res.json({
      bank,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/banks/update', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.bankId) throw new Error("bankId is required");
    if(!req.body.name) throw new Error("bank name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.banks;

    const bank = await Bank.findOne({ _id: req.body.bankId, storeId: req.body.storeId });
    if(!bank) throw new Error("invalid Request"); 
    if(req.body.default) //if default bank
    {
      await Bank.updateMany({}, { default: false}); //if this is selected as default, change other bank default status off 
    }
    const now = moment().tz('Asia/Karachi').toDate();
    bank.name = req.body.name;
    bank.notes = req.body.notes;
    bank.default = req.body.default;
    bank.lastUpdated = now;
    await bank.save();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('banks', now);
    res.json({
      bank,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/banks/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.bankId) throw new Error("bankId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.deleteActivity;
    const txns = await AccountTransaction.countDocuments({ storeId: req.body.storeId, bankId: req.body.bankId });
    if(txns) throw new Error("This bank has transaction in the system so it connot be deleted");

    await Bank.findOneAndDelete({ _id: req.body.bankId, storeId: req.body.storeId });
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    await new DeleteActivity({ 
      storeId: req.body.storeId,
      recordId: req.body.bankId,
      collectionName: 'banks',
      time: now
     }).save();
    await store.logCollectionLastUpdated('deleteActivity', now);
    res.json( { success: true, now, lastAction } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


//Account heads
router.get('/heads', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const heads = await AccountHead.find({ storeId: store._id }, null, { sort: { creationDate: -1 } });
    res.json( heads );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/heads/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.type) throw new Error("head type is required");
    if(!req.body.name) throw new Error("head name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.accountHeads;
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    const head = new AccountHead({
      storeId: req.body.storeId,
      name: req.body.name,
      editAble: true,
      systemHead: false,
      type: req.body.type,
      notes: req.body.notes,
      creationDate: now,
      lastUpdated: now,
      lastTransaction: null
    });
    await head.save();
    await store.logCollectionLastUpdated('accountHeads', now);
    res.json({
      head,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/heads/update', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.headId) throw new Error("headId is required");
    if(!req.body.name) throw new Error("head name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.accountHeads;

    const head = await AccountHead.findOne({ _id: req.body.headId, storeId: req.body.storeId });
    if(!head) throw new Error("invalid Request");

    const now = moment().tz('Asia/Karachi').toDate();
    head.name = req.body.name;
    head.notes = req.body.notes;
    head.lastUpdated = now;
    await head.save();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('accountHeads', now);
    res.json({
      head,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/heads/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.headId) throw new Error("headId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.deleteActivity;
    const txns = await AccountTransaction.countDocuments({ storeId: req.body.storeId, headId: req.body.headId });
    if(txns) throw new Error("This head has transaction in the system so it connot be deleted");

    await AccountHead.findOneAndDelete({ _id: req.body.headId, storeId: req.body.storeId });
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    await new DeleteActivity({ 
      storeId: req.body.storeId,
      recordId: req.body.headId,
      collectionName: 'accountHeads',
      time: now
     }).save();
    await store.logCollectionLastUpdated('deleteActivity', now);
    res.json( { success: true, now, lastAction } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


//Manage Transactions
router.post('/transactions', async (req, res) => {
  try
  {
    if(!req.body.storeId)
      throw new Error("Store id is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
    }
    if(req.body.type)
      conditions.type = req.body.type;
    if(req.body.bankId)
      conditions.bankId = req.body.bankId;
    if(req.body.headId)
      conditions.headId = req.body.headId;
    if(req.body.userId)
      conditions.userId = req.body.userId;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       let startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       let endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.time = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await AccountTransaction.countDocuments(conditions);
    
    const txns = await AccountTransaction.find(conditions, null, { skip, limit: recordsPerPage, sort : { time: -1 }  });

    res.json({
      txns,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/transactions/new', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.headId) throw new Error("headId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    const head = await AccountHead.findOne({_id: req.body.headId, storeId: req.body.storeId });
    if(!head) throw new Error("invalid request");
    if(store.lastEndOfDay && moment(req.body.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot add transaction before last end of day");
    let amount = Number(req.body.amount);
    
    if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE) //expense amount is already negative
      amount = -1 * amount;
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL) //general head
      amount = parseInt(req.body.generalTxnType)  * amount; //pay or recieve, deposit or withdrawl

    let description = "";
    if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME)
      description = "Income received: " + head.name;
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE)
      description = "Expense payment: " + head.name;
    else if(head.name === "Bank Account" && parseInt(req.body.generalTxnType) === -1)
      description = "Cash deposited into bank";
    else if(head.name === "Bank Account" && parseInt(req.body.generalTxnType) === 1)
      description = "Cash withdrawn from bank";
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL && parseInt(req.body.generalTxnType) === -1)
      description = "Amount paid: " + head.name;
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL && parseInt(req.body.generalTxnType) === 1)
      description = "Amount received: " + head.name;

    const record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      headId: req.body.headId,
      amount: amount, //-ve for expense, +ve of income, both for general
      type: parseInt(req.body.type), //cash or bank
      description: description,
      notes: req.body.notes,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    if(head.name === "Bank Account" || parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK)
      record.bankId = req.body.bankId;
    const txn = new AccountTransaction(record);
    await txn.save();
    let bankTxn = null;
    if(head.name === "Bank Account") //record bank transaction if cash deposited or withdrawn
    {
      bankTxn = new AccountTransaction({
        ...record,
        amount: -1 * amount, 
        type: paymentModes.PAYMENT_MODE_BANK,
        parentId: txn._id // link two transactions to help on edit
      });
      await bankTxn.save();
      txn.parentId = bankTxn._id; // link two transactions to help on edit
      await txn.save();
    }
    const response = [txn];
    if(bankTxn)
      response.push(bankTxn);
    res.json( response );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/transactions/update', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.txnId) throw new Error("txnId is required");
    if(!req.body.headId) throw new Error("headId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();

    const head = await AccountHead.findOne({_id: req.body.headId, storeId: req.body.storeId });
    if(!head) throw new Error("invalid request");

    let txn = await AccountTransaction.findOne({ storeId: req.body.storeId, _id: req.body.txnId });
    if(!txn) throw new Error("invalid request");

    if(store.lastEndOfDay && moment(txn.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot update transaction done before last end of day");

    //if transaction head changed
    const oldHead = await AccountHead.findOne({_id: txn.headId, storeId: req.body.storeId });
    if(!oldHead) throw new Error("invalid request");

    let amount = Number(req.body.amount);
    
    if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE) //expense amount is already negative
      amount = -1 * amount;
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL) //general head
      amount = parseInt(req.body.generalTxnType)  * amount; //pay or recieve, deposit or withdrawl

    let description = "";
    if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME)
      description = "Income received: " + head.name;
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE)
      description = "Expense payment: " + head.name;
    else if(head.name === "Bank Account" && parseInt(req.body.generalTxnType) === -1)
      description = "Cash deposited into bank";
    else if(head.name === "Bank Account" && parseInt(req.body.generalTxnType) === 1)
      description = "Cash withdrawn from bank";
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL && parseInt(req.body.generalTxnType) === -1)
      description = "Amount paid: " + head.name;
    else if(head.type === accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL && parseInt(req.body.generalTxnType) === 1)
      description = "Amount received: " + head.name;

    const record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      headId: req.body.headId,
      amount: amount, //-ve for expense, +ve of income, both for general
      type: parseInt(req.body.type), //cash or bank,
      bankId: null,
      description: description,
      notes: req.body.notes,
      time: moment(req.body.time).toDate(),
      lastUpdated: now
    }
    if(head.name === "Bank Account" || parseInt(req.body.type) === paymentModes.PAYMENT_MODE_BANK)
      record.bankId = req.body.bankId;
    await AccountTransaction.findOneAndUpdate({ storeId: req.body.storeId, _id: req.body.txnId }, record);

    txn = await AccountTransaction.findOne({ storeId: req.body.storeId, _id: req.body.txnId });
    let bankTxn = null;
    if(oldHead._id.toString() !== req.body.headId && oldHead.name === "Bank Account")//head changed from Bank account to some else head
    {
      //delete Bank Transaction
      await AccountTransaction.findOneAndDelete({ storeId: req.body.storeId, parentId: req.body.txnId });
      await AccountTransaction.findOneAndUpdate({ storeId: req.body.storeId, _id: req.body.txnId }, { parentId: null }); //reset parent Id
    }else if(oldHead._id.toString() !== req.body.headId && head.name === "Bank Account") //head changed to bank txn
    {
      bankTxn = new AccountTransaction({
        ...record,
        amount: -1 * amount, 
        type: paymentModes.PAYMENT_MODE_BANK,
        parentId: txn._id // link two transactions to help on edit
      });
      await bankTxn.save();
      txn.parentId = bankTxn._id; // link two transactions to help on edit
      await txn.save();
    }else if(oldHead._id.toString() === req.body.headId && head.name === "Bank Account") //head not changed and it is bank account head
    {
      await AccountTransaction.findOneAndUpdate({ storeId: req.body.storeId, parentId: req.body.txnId }, {
        ...record,
        amount: -1 * amount, 
        type: paymentModes.PAYMENT_MODE_BANK,
        parentId: txn._id // link two transactions to help on edit
      });
      bankTxn = await AccountTransaction.findOne({ storeId: req.body.storeId, parentId: req.body.txnId });
    }
    const response = [txn];
    if(bankTxn)
      response.push(bankTxn);
    res.json( response );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/transactions/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.txnId) throw new Error("txnId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    
    const txn = await AccountTransaction.findOne({ _id: req.body.txnId, storeId: req.body.storeId });
    if(!txn) throw new Error("invalid request");
    if(store.lastEndOfDay && moment(txn.time) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete transaction done before last end of day");

    await AccountTransaction.findOneAndDelete({ _id: req.body.txnId, storeId: req.body.storeId });
    await AccountTransaction.findOneAndDelete({ parentId: req.body.txnId, storeId: req.body.storeId });
    await store.updateLastActivity();
    
    res.json( { success: true } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;