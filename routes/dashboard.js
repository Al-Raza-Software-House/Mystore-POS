const router = require('express').Router();
const Store = require('../models/store/Store');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const { paymentModes, closingStates, accountHeadTypes } = require( '../utils/constants' );
const { createNewClosingRecord } = require( '../utils' );
const AccountTransaction = require( '../models/accounts/AccountTransaction' );
const Closing = require( '../models/sale/Closing' );
const AccountHead = require( '../models/accounts/AccountHead' );
const Sale = require( '../models/sale/Sale' );
const Item = require( '../models/stock/Item' );
const Customer = require( '../models/parties/Customer' );
const Supplier = require( '../models/parties/Supplier' );
const Category = require( '../models/stock/Category' );

router.use(authCheck);

router.get('/stats', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const isOwner = await Store.isOwner(req.query.storeId, req.user._id);

    let todayStart = moment().startOf('day').toDate();
    let todayEnd = moment().endOf('day').toDate();
    
    let yesterdayStart = moment().subtract(1, "day").startOf('day').toDate();
    let yesterdayEnd = moment().subtract(1, "day").endOf('day').toDate();

    let stats = { 
      sale: {
        today: {
          saleAmount: 0,
          grossProfit: 0,
          receipts: 0
        },
        yesterday: {
          saleAmount: 0,
          grossProfit: 0,
          receipts: 0
        }
      },
      totals: {},
      dailySales: []
    }
    let aggregate = null;
    if(isOwner)
    {
      //Todays sale stats
      aggregate = await Sale.aggregate([
        { $match: { storeId: store._id, isVoided: false, saleDate: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: "$storeId", totalSaleAmount: { $sum: "$totalAmount" }, totalGrossProfit: { $sum: "$profit" }, totalReceipts: { $sum: 1 } } }
      ]);
      stats.sale.today.saleAmount = aggregate.length ? +(aggregate[0].totalSaleAmount).toFixed(2) : 0;
      stats.sale.today.grossProfit = aggregate.length ? +(aggregate[0].totalGrossProfit).toFixed(2) : 0;
      stats.sale.today.receipts = aggregate.length ? +(aggregate[0].totalReceipts).toFixed(2) : 0;

      //yesterday sale stats
      aggregate = await Sale.aggregate([
        { $match: { storeId: store._id, isVoided: false, saleDate: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
        { $group: { _id: "$storeId", totalSaleAmount: { $sum: "$totalAmount" }, totalGrossProfit: { $sum: "$profit" }, totalReceipts: { $sum: 1 } } }
      ]);
      stats.sale.yesterday.saleAmount = aggregate.length ? +(aggregate[0].totalSaleAmount).toFixed(2) : 0;
      stats.sale.yesterday.grossProfit = aggregate.length ? +(aggregate[0].totalGrossProfit).toFixed(2) : 0;
      stats.sale.yesterday.receipts = aggregate.length ? +(aggregate[0].totalReceipts).toFixed(2) : 0;

      let thirtyDaysBefore = moment().subtract(30, 'days').startOf('day').toDate();

      aggregate = await Sale.aggregate([
        { $match: { storeId: store._id, isVoided: false, saleDate: { $gte: thirtyDaysBefore, $lte: todayEnd } } },
        { $group: { _id: { $dayOfYear: {date: "$saleDate",timezone:'Asia/Karachi'} }, saleDate: { $first: "$saleDate" }, totalSaleAmount: { $sum: "$totalAmount" }, totalGrossProfit: { $sum: "$profit" }, totalReceipts: { $sum: 1 } } },
        {$sort: {_id: 1}}
      ]);
      stats.dailySales = aggregate;
    }

    stats.totals.categories = await Category.countDocuments({ storeId: store._id });
    stats.totals.items = await Item.countDocuments({ storeId: store._id, varientParentId: null, packParentId: null });
    stats.totals.customers = await Customer.countDocuments({ storeId: store._id });
    stats.totals.suppliers = await Supplier.countDocuments({ storeId: store._id });

    aggregate = await Customer.aggregate([
      { $match: { storeId: store._id } },
      { $group: { _id: "$storeId", totalBalance: { $sum: "$currentBalance" } } }
    ]);
    stats.totals.receivable = aggregate.length ? +(aggregate[0].totalBalance).toFixed(2) : 0;

    aggregate = await Supplier.aggregate([
      { $match: { storeId: store._id } },
      { $group: { _id: "$storeId", totalBalance: { $sum: "$currentBalance" } } }
    ]);
    stats.totals.payable = aggregate.length ? +(aggregate[0].totalBalance).toFixed(2) : 0;


    await store.updateLastVisited();

    res.json({  stats });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;