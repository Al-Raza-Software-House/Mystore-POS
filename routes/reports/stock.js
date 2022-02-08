const router = require('express').Router();
const Store = require('../../models/store/Store');
const { authCheck } = require('../../utils/middlewares');
const moment = require("moment-timezone");
const StockTransactions = require( '../../models/stock/StockTransactions' );
const Item = require( '../../models/stock/Item' );

router.use(authCheck);

router.post('/adjustments', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
      reasonId: { $ne: null }
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
    const totalRecords = await StockTransactions.countDocuments(conditions);
    
    const records = await StockTransactions.find(conditions, null, { skip, limit: recordsPerPage, sort : { time: -1 }  });
    
    res.json({
      records,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/bincard', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.itemId) throw new Error("Item id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const item = await Item.findOne({ _id: req.body.itemId, storeId: req.body.storeId });
    if(!item) throw new Error("invalid request");

    const conditions = {
      storeId: req.body.storeId,
      itemId: item._id
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
    const totalRecords = await StockTransactions.countDocuments(conditions);

    const txns = await StockTransactions.find(conditions, null, { skip, limit: recordsPerPage, sort : { time: 1 }  });
    //opening balance before, selected date
    let aggregateConditions = { storeId: store._id, itemId: item._id };
    if(startMoment)
      aggregateConditions.time = { $lt: startMoment };
    let aggregate = await StockTransactions.aggregate([
      { $match: aggregateConditions },
      { $group: { _id: "$itemId", openingStock: { $sum: "$quantity" } } }
    ]);

    const stats = {
      totalRecords,
      openingStock: aggregate.length ? aggregate[0].openingStock : 0,
      netStock: 0,
    }
    if(startMoment && endMoment)
      aggregateConditions.time = { $gte: startMoment, $lte: endMoment };
    //find total purchases, returns, payments in the selected period
    aggregate = await StockTransactions.aggregate([
        { $match: aggregateConditions },
        { $group: { _id: "$itemId", rangeStock: { $sum: "$quantity" } } }
      ]);
    stats.netStock = stats.openingStock + (aggregate.length ? aggregate[0].rangeStock : 0);
    res.json({
      txns,
      stats
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;