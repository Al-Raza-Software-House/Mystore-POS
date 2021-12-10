const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const DeleteActivity = require( '../models/store/DeleteActivity' );
const SupplierLedger = require( '../models/parties/SupplierLedger' );
const { poStates, payOrCreditOptions, paymentModes } = require( '../utils/constants' );
const PurchaseOrder = require( '../models/purchase/PurchaseOrder' );
const GRN = require( '../models/purchase/GRN' );
const { publicS3Object, deleteS3Object } = require( '../utils' );

router.use(authCheck);

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");

    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      storeId: req.body.storeId,
      userId: req.user._id,
      grnNumber: store.idsCursors.grnCursor,
      supplierId: req.body.supplierId,
      poId: req.body.poId ? req.body.poId : null,
      payOrCredit: req.body.payOrCredit,
      bankId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      chequeTxnId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.chequeTxnId : "",
      
      items: [],

      //Bill details
      supplierInvoiceNumber: req.body.supplierInvoiceNumber ? req.body.supplierInvoiceNumber : "",
      billNumber: req.body.billNumber ? req.body.billNumber : "",
      billDate: req.body.billDate ? moment(req.body.billDate).tz('Asia/Karachi').toDate() : null,
      billDueDate: req.body.billDueDate ? moment(req.body.billDueDate).tz('Asia/Karachi').toDate() : null,

      //other Expenses
      loadingExpense: req.body.loadingExpense ? Number(req.body.loadingExpense) : 0,
      freightExpense: req.body.freightExpense ? Number(req.body.freightExpense) : 0,
      otherExpense: req.body.otherExpense ? Number(req.body.otherExpense) : 0,
      adjustmentAmount: req.body.adjustmentAmount ? Number(req.body.adjustmentAmount) : 0,
      purchaseTax: req.body.purchaseTax ? Number(req.body.purchaseTax) : 0,
      
      attachment: req.body.attachment ? req.body.attachment : "",
      notes: req.body.notes ? req.body.notes : "",

      grnDate: req.body.grnDate ? moment(req.body.grnDate).tz('Asia/Karachi').toDate() : null,
      creationDate: now,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];
    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;

    items.forEach(item => {
      let costPrice = isNaN(item.costPrice) ? 0 : Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      let adjustment = isNaN(item.adjustment) ? 0 :  quantity * Number(item.adjustment);
      let tax = isNaN(item.tax) ? 0 :  quantity * Number(item.tax);
      
      if(quantity === 0) return;
      totalItems++;
      totalQuantity += quantity;
      totalAmount += costPrice * quantity;
      totalAmount += tax;
      totalAmount -= adjustment;

      record.items.push({
        _id: item._id,
        costPrice,
        salePrice: isNaN(item.salePrice) ? 0 : Number(item.salePrice),
        packSalePrice: isNaN(item.packSalePrice) ? 0 : Number(item.packSalePrice),
        adjustment: isNaN(item.adjustment) ? 0 : Number(item.adjustment),
        tax: isNaN(item.tax) ? 0 : Number(item.tax),
        batchNumber: item.batchNumber ? item.batchNumber : "",
        batchExpiryDate: item.batchExpiryDate ? moment(item.batchExpiryDate).toDate() : null,
        quantity,
        notes: item.notes ? item.notes : ""
      })
    });

    totalAmount += isNaN(req.body.loadingExpense) ? 0 : Number(req.body.loadingExpense);
    totalAmount += isNaN(req.body.freightExpense) ? 0 : Number(req.body.freightExpense);
    totalAmount += isNaN(req.body.otherExpense) ? 0 : Number(req.body.otherExpense);
    totalAmount += isNaN(req.body.adjustmentAmount) ? 0 : Number(req.body.adjustmentAmount);
    totalAmount += isNaN(req.body.purchaseTax) ? 0 : Number(req.body.purchaseTax);

    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);

    const grn = new GRN(record);
    await grn.save();
    await store.updateLastActivity();
    store.idsCursors.grnCursor = store.idsCursors.grnCursor + 1;
    await store.save();
    if(req.body.attachment)
    {
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/grns/' + req.body.attachment;
      await publicS3Object( key );
    }
    res.json({
      grn
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
    if(!req.body.supplierId) throw new Error("supplierId is required");
    if(!req.body.grnId) throw new Error("grnId is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");
    
    const grn = await GRN.findOne({ _id: req.body.grnId, storeId: req.body.storeId});
    if(!grn) throw new Error("invalid Request");
    if(store.lastEndOfDay && moment(grn.grnDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete GRN done before last end of day");

    const now = moment().tz('Asia/Karachi').toDate();
    if(req.body.attachment && grn.attachment !== req.body.attachment) // uploaded new image, 
    {
      if(grn.attachment) // if item has old image , delete old image
        await deleteS3Object( process.env.AWS_KEY_PREFIX + req.body.storeId + '/grns/' + grn.attachment );
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/grns/' + req.body.attachment;
      await publicS3Object( key );
    }

    let record = {
      userId: req.user._id,
      payOrCredit: req.body.payOrCredit,
      bankId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.bankId : null,
      chequeTxnId:  Number(req.body.payOrCredit) === payOrCreditOptions.PAY_NOW && Number(req.body.paymentMode) === paymentModes.PAYMENT_MODE_BANK ? req.body.chequeTxnId : "",
      
      items: [],

      //Bill details
      supplierInvoiceNumber: req.body.supplierInvoiceNumber ? req.body.supplierInvoiceNumber : "",
      billNumber: req.body.billNumber ? req.body.billNumber : "",
      billDate: req.body.billDate ? moment(req.body.billDate).tz('Asia/Karachi').toDate() : null,
      billDueDate: req.body.billDueDate ? moment(req.body.billDueDate).tz('Asia/Karachi').toDate() : null,

      //other Expenses
      loadingExpense: req.body.loadingExpense ? Number(req.body.loadingExpense) : 0,
      freightExpense: req.body.freightExpense ? Number(req.body.freightExpense) : 0,
      otherExpense: req.body.otherExpense ? Number(req.body.otherExpense) : 0,
      adjustmentAmount: req.body.adjustmentAmount ? Number(req.body.adjustmentAmount) : 0,
      purchaseTax: req.body.purchaseTax ? Number(req.body.purchaseTax) : 0,
      
      attachment: req.body.attachment ? req.body.attachment : "",
      notes: req.body.notes ? req.body.notes : "",

      grnDate: req.body.grnDate ? moment(req.body.grnDate).tz('Asia/Karachi').toDate() : null,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];
    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;

    items.forEach(item => {
      let costPrice = isNaN(item.costPrice) ? 0 : Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      let adjustment = isNaN(item.adjustment) ? 0 :  quantity * Number(item.adjustment);
      let tax = isNaN(item.tax) ? 0 :  quantity * Number(item.tax);
      
      if(quantity === 0) return;
      totalItems++;
      totalQuantity += quantity;
      totalAmount += costPrice * quantity;
      totalAmount += tax;
      totalAmount -= adjustment;

      record.items.push({
        _id: item._id,
        costPrice,
        salePrice: isNaN(item.salePrice) ? 0 : Number(item.salePrice),
        packSalePrice: isNaN(item.packSalePrice) ? 0 : Number(item.packSalePrice),
        adjustment: isNaN(item.adjustment) ? 0 : Number(item.adjustment),
        tax: isNaN(item.tax) ? 0 : Number(item.tax),
        batchNumber: item.batchNumber ? item.batchNumber : "",
        batchExpiryDate: item.batchExpiryDate ? moment(item.batchExpiryDate).toDate() : null,
        quantity,
        notes: item.notes ? item.notes : ""
      })
    });

    totalAmount += isNaN(req.body.loadingExpense) ? 0 : Number(req.body.loadingExpense);
    totalAmount += isNaN(req.body.freightExpense) ? 0 : Number(req.body.freightExpense);
    totalAmount += isNaN(req.body.otherExpense) ? 0 : Number(req.body.otherExpense);
    totalAmount += isNaN(req.body.adjustmentAmount) ? 0 : Number(req.body.adjustmentAmount);
    totalAmount += isNaN(req.body.purchaseTax) ? 0 : Number(req.body.purchaseTax);

    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);

    grn.set(record);
    await grn.save();
    await store.updateLastActivity();
    res.json({
      grn
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
    if(!req.body.grnId) throw new Error("GRN ID is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    
    const grn = await GRN.findOne({ _id: req.body.grnId, storeId: req.body.storeId});
    if(!grn) throw new Error("invalid Request");
    if(store.lastEndOfDay && moment(grn.grnDate) <= moment(store.lastEndOfDay))
      throw new Error("Cannot delete GRN done before last end of day");
    await GRN.findOneAndDelete({ _id: req.body.grnId, storeId: req.body.storeId });
    await store.updateLastActivity();
    res.json( { success: true } );
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
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
    }
    if(req.body.supplierId)
      conditions.supplierId = req.body.supplierId;
    if(req.body.dateRange)
    {
       let parts = req.body.dateRange.split(" - ");
       let startMoment = moment(parts[0], "DD MMM, YYYY").startOf('day').toDate();
       let endMoment = moment(parts[1], "DD MMM, YYYY").endOf('day').toDate();
       conditions.grnDate = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await PurchaseOrder.countDocuments(conditions);
    
    const grns = await GRN.find(conditions, null, { skip, limit: recordsPerPage, sort : { creationDate: -1 }  });

    res.json({
      grns,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;