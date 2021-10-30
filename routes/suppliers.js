const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");

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
      openingBalance: 0,
      currentBalance: 0,
      creationDate: now,
      lastUpdated: now
    }
    const supplier = new Supplier(record);
    await supplier.save();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('suppliers');
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


module.exports = router;