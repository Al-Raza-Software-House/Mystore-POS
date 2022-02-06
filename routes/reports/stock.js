const router = require('express').Router();
const Store = require('../../models/store/Store');
const { authCheck } = require('../../utils/middlewares');
const moment = require("moment-timezone");
const StockTransactions = require( '../../models/stock/StockTransactions' );

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

module.exports = router;