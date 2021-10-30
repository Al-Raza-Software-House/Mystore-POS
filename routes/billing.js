const router = require('express').Router();
const Store = require('../models/store/Store');
const BillingTransaction = require('../models/store/BillingTransaction');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");

router.use(['/transactions', '/pay', '/ping'], authCheck);

router.post('/pay', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.months) throw new Error("Please select months");
    if(!req.body.phone) throw new Error("Easypaisa mobile number is required");

    let store = await Store.findById(req.body.storeId);    
    if(store === null)
      throw new Error("Invalid request");
    
    if(!(await Store.isManager(req.body.storeId, req.user._id) ))
      throw new Error("Invalid Request");

    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi');
    let expiry = moment(store.expiryDate);
    if(now.isAfter(expiry)) //if store is already expired, count expiry from today
      expiry = moment().tz('Asia/Karachi');
    //generate EasyPaisa request here
    let record = {
      storeId: req.body.storeId,
      transactionId: Math.random().toString(36).substring(7),
      monthsPaid: parseInt(req.body.months),
      amount: parseInt(req.body.months) * store.monthlyPricing,
      monthlyPricing: store.monthlyPricing,
      time: now.toDate(),
      userId: req.user._id,
      userName: req.user.name,
      userPhone: req.user.phone,
      mobileAccountNumber: req.body.phone,
      prevExpiryDate: moment(store.expiryDate).toDate(),
      nextExpiryDate: expiry.add(req.body.months, 'months').toDate(),
      transactionStatus: 'pending'
    }
    const txn = new BillingTransaction(record);
    await txn.save();

    res.json({ success: true, txnId: txn._id });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/ping', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");
    if(!req.query.txnId) throw new Error("Transaction id select months");

    let store = await Store.findById(req.query.storeId);    
    if(store === null)
      throw new Error("Invalid request");
    const lastUpdated = store.dataUpdated.stores;
    if(!(await Store.isManager(req.query.storeId, req.user._id) ))
      throw new Error("Invalid Request");
    const txn = await BillingTransaction.findOne({ storeId: req.query.storeId, _id: req.query.txnId });
    if(txn === null) throw new Error("invalid request");

    res.json({
      success: txn.transactionStatus === 'completed',
      lastUpdated
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//get all transactions
router.get('/transactions', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");

    let store = await Store.findById(req.query.storeId);    
    if(store === null)
      throw new Error("Invalid request");
    if(!(await Store.isManager(req.query.storeId, req.user._id) ))
      throw new Error("Invalid Request");
    await store.updateLastVisited();
      
    const txns = await BillingTransaction.find({ storeId: req.query.storeId, transactionStatus: 'completed' }).sort({ time: -1 });
    res.json(txns);
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});




router.post('/easypaisaCB', async (req, res) => {
  try
  {
    //verify Webhook
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.transactionId) throw new Error("transactions ID is required");

    let store = await Store.findById(req.body.storeId);    
    if(store === null)
      throw new Error("Invalid request");
    
    let txn = await BillingTransaction.findOne({ storeId: req.body.storeId, transactionId: req.body.transactionId });
    if(txn === null)
      throw new Error("Invalid request");
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      time: now,
      transactionStatus: 'completed'
    }
    await BillingTransaction.findOneAndUpdate({ storeId: req.body.storeId, transactionId: req.body.transactionId }, record);
    record = {
      expiryDate: txn.nextExpiryDate,
      lastPayment: now
    }
    await Store.findByIdAndUpdate(req.body.storeId, record);
    await store.logCollectionLastUpdated('stores');
    res.json({ success: true });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;
