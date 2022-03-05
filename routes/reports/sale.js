const router = require('express').Router();
const Store = require('../../models/store/Store');
const { authCheck } = require('../../utils/middlewares');
const moment = require("moment-timezone");
const Item = require( '../../models/stock/Item' );
const SaleItem = require( '../../models/sale/SaleItem' );
const mongoose = require('mongoose');
const Sale = require( '../../models/sale/Sale' );

router.use(authCheck);

router.post('/itemtrends', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.itemId && !req.body.categoryId && !req.body.supplierId) throw new Error("Please select a filter");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();    

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
      month: { $month: {date: "$time", timezone:'Asia/Karachi'} },
      day: { $dayOfMonth: {date: "$time", timezone:'Asia/Karachi'} },
      year: { $year: {date: "$time", timezone:'Asia/Karachi'} }
    };
    let aggregate = await SaleItem.aggregate([
        { $match: conditions },
        { $group: { _id: group_by, time: { $first: "$time" }, totalQuantity: { $sum: "$unitsQuantity" }, totalSaleAmount: { $sum: { "$multiply" : ["$quantity", "$salePrice"] } }, totalProfit: { $sum: "$totalProfit" } } },
        {$sort: {_id: 1}}
      ]);
    
    res.json(aggregate)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/history', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();    

    const conditions = {
      storeId: store._id,
      isVoided: false,
    }
    if(req.body.userId)
      conditions.userId = new mongoose.mongo.ObjectId(req.body.userId );
    if(req.body.customerId)
      conditions.customerId = new mongoose.mongo.ObjectId(req.body.customerId );

    let startMoment = null;
    let endMoment = null;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.saleDate = { $gte: startMoment, $lte: endMoment };
    }

    let group_by = {
      month: { $month: {date: "$saleDate", timezone:'Asia/Karachi'} },
      day: { $dayOfMonth: {date: "$saleDate", timezone:'Asia/Karachi'} },
      year: { $year: {date: "$saleDate", timezone:'Asia/Karachi'} }
    };
    let aggregate = await Sale.aggregate([
        { $match: conditions },
        { $group: { _id: group_by, saleDate: { $first: "$saleDate" }, totalSaleAmount: { $sum: "$totalAmount" }, totalGrossProfit: { $sum: "$profit" }, totalReceipts: { $sum: 1 } } },
        {$sort: {_id: 1}}
      ]);
    
    res.json(aggregate)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/items', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();    

    const conditions = {
      storeId: store._id,
      isVoided: false,
      saleVoided: false
    }
    if(req.body.categoryId) conditions.categoryId = new mongoose.mongo.ObjectId(req.body.categoryId );
    if(req.body.supplierId) conditions.supplierId = new mongoose.mongo.ObjectId(req.body.supplierId );

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
    let sort = { _id: 1 };
    if(req.body.type === 'topSelling')
      sort = { totalQuantity: -1 }
    else if(req.body.type === 'lowselling')
      sort = { totalQuantity: 1 }
    else if(req.body.type === 'topprofitable')
      sort = { totalProfit: -1 }
    else if(req.body.type === 'lowprofitable')
      sort = { totalProfit: 1 }

    let aggregate = await SaleItem.aggregate([
        { $match: conditions },
        { $group: { _id: "$baseItemId", totalQuantity: { $sum: "$unitsQuantity" }, totalSaleAmount: { $sum: { "$multiply" : ["$quantity", "$salePrice"] } }, totalProfit: { $sum: "$totalProfit" } } },
        { $sort: sort },
        {
          $facet: {
              paginatedResults: [{ $skip: skip }, { $limit: recordsPerPage }],
              totalCount: [
                {
                  $count: 'count'
                }
              ]
            }
        }
      ]);
    let records = aggregate[0].paginatedResults;
    let totalRecords = aggregate[0].totalCount.length ? aggregate[0].totalCount[0].count : 0;
    
    res.json({ records, totalRecords })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/zerosales', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();    

    const conditions = {
      storeId: store._id,
      isVoided: false,
      saleVoided: false
    }
    if(req.body.categoryId) conditions.categoryId = new mongoose.mongo.ObjectId(req.body.categoryId );
    if(req.body.supplierId) conditions.supplierId = new mongoose.mongo.ObjectId(req.body.supplierId );

    let startMoment = null;
    let endMoment = null;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.time = { $gte: startMoment, $lte: endMoment };
    }

    
    let aggregate = await SaleItem.aggregate([
        { $match: conditions },
        { $group: { _id: "$baseItemId", totalQuantity: { $sum: "$unitsQuantity" } } }
      ]);
    let itemIds = aggregate.map(record => record._id);
    res.json(itemIds)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;