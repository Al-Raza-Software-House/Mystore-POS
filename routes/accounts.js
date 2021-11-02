const router = require('express').Router();
const Store = require('../models/store/Store');
const AccountHead = require('../models/accounts/AccountHead');
const Bank = require('../models/accounts/Bank');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const DeleteActivity = require( '../models/store/DeleteActivity' );

router.use(authCheck);

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
    // const txns = await StockTransactions.countDocuments({ storeId: req.body.storeId, bankId: req.body.bankId });
    // if(txns) throw new Error("This bank is being used to adjust stock so it connot be deleted");

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
``

router.post('/heads/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.headId) throw new Error("headId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.deleteActivity;
    // const txns = await StockTransactions.countDocuments({ storeId: req.body.storeId, bankId: req.body.bankId });
    // if(txns) throw new Error("This bank is being used to adjust stock so it connot be deleted");

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


module.exports = router;