const router = require('express').Router();
const Store = require('../../models/store/Store');
const { authCheck } = require('../../utils/middlewares');
const moment = require("moment-timezone");
const mongoose = require('mongoose');
const GRN = require( '../../models/purchase/GRN' );

router.use(authCheck);

router.post('/history', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();    

    const conditions = {
      storeId: store._id,
    }
    if(req.body.supplierId)
      conditions.supplierId = new mongoose.mongo.ObjectId(req.body.supplierId );

    let startMoment = null;
    let endMoment = null;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.grnDate = { $gte: startMoment, $lte: endMoment };
    }

    let group_by = {
      month: { $month: {date: "$grnDate", timezone:'Asia/Karachi'} },
      day: { $dayOfMonth: {date: "$grnDate", timezone:'Asia/Karachi'} },
      year: { $year: {date: "$grnDate", timezone:'Asia/Karachi'} }
    };
    let aggregate = await GRN.aggregate([
        { $match: conditions },
        { $group: { _id: group_by, grnDate: { $first: "$grnDate" }, totalAmount: { $sum: "$totalAmount" }, totalGrns: { $sum: 1 } } },
        {$sort: {_id: 1}}
      ]);
    
    res.json(aggregate)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;