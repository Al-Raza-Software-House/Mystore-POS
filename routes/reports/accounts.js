const router = require('express').Router();
const Store = require('../../models/store/Store');
const { authCheck } = require('../../utils/middlewares');
const moment = require("moment-timezone");
const mongoose = require('mongoose');
const AccountTransaction = require( '../../models/accounts/AccountTransaction' );
const AccountHead = require( '../../models/accounts/AccountHead' );
const { accountHeadTypes } = require( '../../utils/constants' );
const Sale = require( '../../models/sale/Sale' );
const GRN = require( '../../models/purchase/GRN' );

router.use(authCheck);

router.post('/incomestatement', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    let conditions = {
      storeId: store._id,
      isVoided: false
    }

    let startMoment = null;
    let endMoment = null;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.saleDate = { $gte: startMoment, $lte: endMoment };
    }

    let stats = {
      sale: {
        totalSale: 0,
        totalGrossProfit: 0,
        totalCost: 0,
        totalCashSale: 0,
        totalBankSale: 0,
        totalCreditSale: 0,
      },
      purchase: {
        totalLoadingExpense: 0,
        totalFreightExpense: 0,
        totalOtherExpense: 0,
        totalPurchaseTax: 0,
      },
      accounts:{
        income: 0,
        expenses: 0,
      }
    }

    let aggregate = await Sale.aggregate([
      { $match: conditions },
      { $group: { _id: '$storeId', totalSale: { $sum: "$totalAmount" }, totalGrossProfit: { $sum: "$profit" }, totalCost: { $sum: "$totalCost" }, totalCashSale: { $sum: "$cashAmount" }, totalBankSale: { $sum: "$bankAmount" }, totalCreditSale: { $sum: "$creditAmount" } } },
    ]);
    if(aggregate.length)
      stats.sale = aggregate[0];
    
    conditions = { storeId: store._id }
    if(startMoment && endMoment)
    {
      conditions.grnDate = { $gte: startMoment, $lte: endMoment };
    }
    aggregate = await GRN.aggregate([
        { $match: conditions },
        { $group: { _id: '$storeId', totalLoadingExpense: { $sum: "$loadingExpense" }, totalFreightExpense: { $sum: "$freightExpense" }, totalOtherExpense: { $sum: "$otherExpense" }, totalPurchaseTax: { $sum: "$purchaseTax" } } },
      ]);
    if(aggregate.length)
      stats.purchase = aggregate[0];
    
    let incomeHeads = await AccountHead.find({ storeId: store._id, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME });
    let expenseHeads = await AccountHead.find({ storeId: store._id, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE });  
    incomeHeads = incomeHeads.map(head => head._id);
    expenseHeads = expenseHeads.map(head => head._id);
    
    conditions = { storeId: store._id }
    if(startMoment && endMoment)
    {
      conditions.time = { $gte: startMoment, $lte: endMoment };
    }

    conditions.headId = { $in: incomeHeads }
    aggregate = await AccountTransaction.aggregate([
        { $match: conditions },
        { $group: { _id: '$storeId', totalAmount: { $sum: "$amount" } } }
      ]);
    if(aggregate.length)
      stats.accounts.income = aggregate[0].totalAmount;

    conditions.headId = { $in: expenseHeads }
    aggregate = await AccountTransaction.aggregate([
        { $match: conditions },
        { $group: { _id: '$storeId', totalAmount: { $sum: "$amount" } } }
      ]);
    if(aggregate.length)
      stats.accounts.expenses = aggregate[0].totalAmount;

    res.json(stats)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/expenses', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store id is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: store._id,
    }
    if(req.body.headId)
      conditions.headId = new mongoose.mongo.ObjectId(req.body.headId );
    else
    {
      const heads = await AccountHead.find({ storeId: store._id, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE });
      let headIds = heads.map(head => head._id);
      conditions.headId = { $in: headIds }
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
      year: { $year: {date: "$time", timezone:'Asia/Karachi'} }
    };
    let aggregate = await AccountTransaction.aggregate([
        { $match: conditions },
        { $group: { _id: group_by, month: { $first: "$time" }, totalAmount: { $sum: "$amount" }, totalTxns: { $sum: 1 } } },
        {$sort: {_id: 1}}
      ]);
    
    res.json(aggregate)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;