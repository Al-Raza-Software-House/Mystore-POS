const router = require('express').Router();
const Store = require('../models/store/Store');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const { paymentModes, closingStates, accountHeadTypes } = require( '../utils/constants' );
const { createNewClosingRecord } = require( '../utils' );
const AccountTransaction = require( '../models/accounts/AccountTransaction' );
const Closing = require( '../models/sale/Closing' );
const AccountHead = require( '../models/accounts/AccountHead' );

router.use(authCheck);

router.post('/close', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.closingId) throw new Error("closingId is required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    let closing = await Closing.findOne({ _id: req.body.closingId, storeId: req.body.storeId });
    if(!closing) throw new Error("invalid request");

    if(closing.status === closingStates.CLOSING_STATUS_CLOSED)
      throw new Error("This record is already closed");
    const now = moment().tz('Asia/Karachi').toDate();

    closing = await getClosingData(store, closing);
    closing.cashCounted = isNaN(req.body.cashCounted) ? 0 : +Number(req.body.cashCounted).toFixed(2);
    closing.cashDifference = closing.cashCounted - closing.expectedCash;
    closing.cashDifference = +(closing.cashDifference).toFixed(2);
    closing.userId = req.user._id;
    closing.endTime = now;
    closing.status = closingStates.CLOSING_STATUS_CLOSED;
    closing.notes = req.body.notes ? req.body.notes : "";
    await closing.save();

    let newClosing = await createNewClosingRecord(store._id, req.user._id, now, closing.cashCounted);

    store.lastEndOfDay = now;
    await store.save();
    

    await store.updateLastActivity();

    res.json({
      closedRecord: closing,
      openedRecord: newClosing,
      lastEndOfDay: store.lastEndOfDay
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
    if(!req.body.closingId) throw new Error("Closing ID is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const closing = await Closing.findOne({ _id: req.body.closingId, storeId: req.body.storeId});
    if(!closing) throw new Error("invalid Request");
    if( closing.status === closingStates.CLOSING_STATUS_CLOSED )
      throw new Error("You cannot delete closed records");

    let previousClosing = await Closing.findOne({ storeId: req.body.storeId, endTime: closing.startTime });
    if( !previousClosing )
      throw new Error("There are no previous closings, Store should have one record OPEN");
    
    await Closing.deleteOne({ _id: req.body.closingId, storeId: req.body.storeId});
    previousClosing.endTime = null;
    previousClosing.status = closingStates.CLOSING_STATUS_OPEN;
    await previousClosing.save();
    
    store.lastEndOfDay = previousClosing.startTime;
    await store.save();
    await store.updateLastActivity();
    
    res.json( { 
      deletedClosing: closing,
      openedClosing: previousClosing,
      lastEndOfDay: store.lastEndOfDay
    } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/', async (req, res) => {
  try
  {
    if(!req.body.storeId)
      throw new Error("Store id is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
    }
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       let startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       let endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.endTime = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await Closing.countDocuments(conditions);
    
    const closings = await Closing.find(conditions, null, { skip, limit: recordsPerPage, sort : { startTime: -1 }  });

    res.json({
      closings,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

const getClosingData = async (store, closing) => {
  let systemHeads = store.accountHeadIds;
  let startTime = moment(closing.startTime).toDate();
  let aggregate = null;
  let incomeHeads = await AccountHead.find({ storeId: store._id, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME });
  let expenseHeads = await AccountHead.find({ storeId: store._id, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE });
  let generalHeads = await AccountHead.find({ storeId: store._id, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL, _id: { $ne: systemHeads.BankAccount } });

  incomeHeads = incomeHeads.map(head => head._id);
  expenseHeads = expenseHeads.map(head => head._id);
  generalHeads = generalHeads.map(head => head._id);

  //inflows

  //get cash Sales
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: systemHeads.Sales } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.inflows.cashSales = +(aggregate[0].totalAmount).toFixed(2);
  //customer Receipt
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: systemHeads.CustomerReceipt } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.inflows.customerCreditPayments = +(aggregate[0].totalAmount).toFixed(2);
    
  //all from income heads
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: { $in: incomeHeads } } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.inflows.income = +(aggregate[0].totalAmount).toFixed(2);
  
  //Bank Withdrawl
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: systemHeads.BankAccount, amount: { $gt: 0 } } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.inflows.cashFromBank = +(aggregate[0].totalAmount).toFixed(2);
  
  //other cash ins
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: { $in: generalHeads }, amount: { $gt: 0 } } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.inflows.other = +(aggregate[0].totalAmount).toFixed(2);

  closing.totalInflow = closing.inflows.cashSales + closing.inflows.customerCreditPayments + closing.inflows.income + closing.inflows.cashFromBank + closing.inflows.other;
  closing.totalInflow = +(closing.totalInflow).toFixed(2);
  //outflows

  //cash purchases
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: systemHeads.Purchase } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.outflows.cashPurchases = -1 * (+(aggregate[0].totalAmount).toFixed(2));
  //Supplier payment in ledger
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: systemHeads.SupplierPayment } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.outflows.supplierPayments = -1 * (+(aggregate[0].totalAmount).toFixed(2));
    
  //all from expense heads
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: { $in: expenseHeads } } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.outflows.expenses = -1 * (+(aggregate[0].totalAmount).toFixed(2));
  
  //Bank Deposit
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: systemHeads.BankAccount, amount: { $lt: 0 } } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.outflows.cashToBank = -1 * (+(aggregate[0].totalAmount).toFixed(2));
  
  //other cash out
  aggregate = await AccountTransaction.aggregate([
    { $match: { storeId: store._id, time: { $gte: startTime }, type: paymentModes.PAYMENT_MODE_CASH, headId: { $in: generalHeads }, amount: { $lt: 0 } } },
    { $group: { _id: "$storeId", totalAmount: { $sum: "$amount" } } }
  ]);
  if(aggregate.length)
    closing.outflows.other = -1 * (+(aggregate[0].totalAmount).toFixed(2));


  closing.totalOutflow = closing.outflows.cashPurchases + closing.outflows.supplierPayments + closing.outflows.expenses + closing.outflows.cashToBank + closing.outflows.other;
  closing.totalOutflow = +(closing.totalOutflow).toFixed(2);

  closing.expectedCash = (closing.openingCash + closing.totalInflow) - closing.totalOutflow;
  closing.expectedCash = +(closing.expectedCash).toFixed(2);

  return closing;
}

router.get('/', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.query.storeId,
      _id: req.query.closingId
    }
    let closing = await Closing.findOne(conditions);
    if(closing && closing.status === closingStates.CLOSING_STATUS_OPEN)
      closing = await getClosingData(store, closing);
    res.json({ closing });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;