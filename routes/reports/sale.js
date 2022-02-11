const router = require('express').Router();
const Store = require('../../models/store/Store');
const { authCheck } = require('../../utils/middlewares');
const moment = require("moment-timezone");
const Item = require( '../../models/stock/Item' );
const SaleItem = require( '../../models/sale/SaleItem' );
const mongoose = require('mongoose');

router.use(authCheck);

router.post('/itemtrends', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.itemId && !req.body.categoryId && !req.body.supplierId) throw new Error("Please select a filter");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    if(req.body.itemId)
    {
      const item = await Item.findOne({ _id: req.body.itemId, storeId: req.body.storeId });
      if(!item) throw new Error("invalid request");
    }

    const conditions = {
      storeId: store._id,
      isVoided: false,
      saleVoided: false
    }
    if(req.body.itemId)
      conditions.baseItemId = new mongoose.mongo.ObjectId(req.body.itemId );
    else
    {
      if(req.body.categoryId) conditions.categoryId = new mongoose.mongo.ObjectId(req.body.categoryId );
      if(req.body.supplierId) conditions.supplierId = new mongoose.mongo.ObjectId(req.body.supplierId );
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

    let group_by = {
      month: { $month: "$time" },
      day: { $dayOfMonth: "$time" },
      year: { $year: "$time" }
    };
    let aggregate = await SaleItem.aggregate([
        { $match: conditions },
        { $group: { _id: group_by, time: { $first: "$time" }, totalQuantity: { $sum: "$unitsQuantity" }, totalSaleAmount: { $sum: { "$multiply" : ["$quantity", "$salePrice"] } }, totalProfit: { $sum: "$totalProfit" } } }
      ]);
    
    res.json(aggregate)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;