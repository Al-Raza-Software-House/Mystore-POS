const router = require('express').Router();
const Store = require('../models/store/Store');
const AdjustmentReason = require('../models/stock/AdjustmentReason');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const StockTransactions = require( '../models/stock/StockTransactions' );
const DeleteActivity = require( '../models/store/DeleteActivity' );

router.use(authCheck);

router.get('/', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();
    let conditions = { storeId: req.query.storeId };
    
    const reasons = await AdjustmentReason.find(conditions, null, { sort : { creationDate: -1 } });
    res.json( reasons );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.name) throw new Error("reason name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.adjustmentReasons;
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    const reason = new AdjustmentReason({
      storeId: req.body.storeId,
      name: req.body.name,
      notes: req.body.notes,
      default: false,
      creationDate: now,
      lastUpdated: now
    });
    await reason.save();
    await store.logCollectionLastUpdated('adjustmentReasons', now);
    res.json({
      reason,
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
    if(!req.body.reasonId) throw new Error("reasonId is required");
    if(!req.body.name) throw new Error("reason name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.adjustmentReasons;
    const reason = await AdjustmentReason.findOne({ _id: req.body.reasonId, storeId: req.body.storeId });
    if(!reason) throw new Error("invalid Request"); 
    const now = moment().tz('Asia/Karachi').toDate();
    if(!reason.default)
    {
      reason.name = req.body.name;
      reason.notes = req.body.notes;
      reason.lastUpdated = now;
      await reason.save();
      await store.updateLastActivity();
      await store.logCollectionLastUpdated('adjustmentReasons', now);
    }
    res.json({
      reason,
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
    if(!req.body.reasonId) throw new Error("reasonId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const lastAction = store.dataUpdated.deleteActivity;
    const txns = await StockTransactions.countDocuments({ storeId: req.body.storeId, reasonId: req.body.reasonId });
    if(txns) throw new Error("This reason is being used to adjust stock so it connot be deleted");

    await AdjustmentReason.findOneAndDelete({ _id: req.body.reasonId, storeId: req.body.storeId });
    await store.updateLastActivity();
    const now = moment().tz('Asia/Karachi').toDate();
    await new DeleteActivity({ 
      storeId: req.body.storeId,
      recordId: req.body.reasonId,
      collectionName: 'adjustmentReasons',
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