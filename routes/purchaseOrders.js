const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const DeleteActivity = require( '../models/store/DeleteActivity' );
const SupplierLedger = require( '../models/parties/SupplierLedger' );
const { poStates } = require( '../utils/constants' );
const PurchaseOrder = require( '../models/purchase/PurchaseOrder' );
const GRN = require( '../models/purchase/GRN' );

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
      supplierId: req.body.supplierId,
      poNumber: store.idsCursors.poCursor,
      referenceNumber: req.body.referenceNumber ? req.body.referenceNumber : "",
      status: poStates.PO_STATUS_OPEN,
      notes: req.body.notes ? req.body.notes : "",
      items: [],

      issueDate: req.body.issueDate ? moment(req.body.issueDate).tz('Asia/Karachi').toDate() : null,
      deliveryDate: req.body.deliveryDate ? moment(req.body.deliveryDate).tz('Asia/Karachi').toDate() : null,
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
      if(quantity === 0) return;
      totalItems++;
      totalQuantity += quantity;
      totalAmount += costPrice * quantity;
      record.items.push({
        _id: item._id,
        costPrice,
        quantity
      })
    });
    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);

    const order = new PurchaseOrder(record);
    await order.save();
    await store.updateLastActivity();
    store.idsCursors.poCursor = store.idsCursors.poCursor + 1;
    await store.save();
    res.json({
      order
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
    if(!req.body.poId) throw new Error("Purchase order ID is required");
    if(!req.body.items) throw new Error("items are required");

    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const supplier = await Supplier.findOne({ _id: req.body.supplierId, storeId: req.body.storeId });
    if(!supplier) throw new Error("invalid request");
    
    const order = await PurchaseOrder.findOne({ _id: req.body.poId, storeId: req.body.storeId});
    if(!order) throw new Error("invalid Request");
    if(order.status === poStates.PO_STATUS_CLOSED) throw new Error("This purchase order is closed so cannot be updated");

    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      userId: req.user._id,
      supplierId: req.body.supplierId,
      referenceNumber: req.body.referenceNumber ? req.body.referenceNumber : "",
      notes: req.body.notes ? req.body.notes : "",
      items: [],

      issueDate: req.body.issueDate ? moment(req.body.issueDate).tz('Asia/Karachi').toDate() : null,
      deliveryDate: req.body.deliveryDate ? moment(req.body.deliveryDate).tz('Asia/Karachi').toDate() : null,
      lastUpdated: now,
    }
    let items = req.body.items ? req.body.items : [];
    let totalItems = 0;
    let totalQuantity = 0;
    let totalAmount = 0;

    items.forEach(item => {
      let costPrice = isNaN(item.costPrice) ? 0 : Number(item.costPrice);
      let quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      if(quantity === 0) return;
      totalItems++;
      totalQuantity += quantity;
      totalAmount += costPrice * quantity;
      record.items.push({
        _id: item._id,
        costPrice,
        quantity
      })
    });
    record.totalItems = totalItems;
    record.totalQuantity = +totalQuantity.toFixed(2);
    record.totalAmount = +totalAmount.toFixed(2);

    order.set(record);
    await order.save();
    await store.updateLastActivity();
    res.json({
      order
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
    if(!req.body.poId) throw new Error("Purchase order ID is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);

    if(!store) throw new Error("invalid Request");
    
    const order = await PurchaseOrder.findOne({ _id: req.body.poId, storeId: req.body.storeId});
    if(!order) throw new Error("invalid Request");
    if(order.status === poStates.PO_STATUS_CLOSED) throw new Error("This purchase order is closed so cannot be deleted");

    const grns = await GRN.find({ storeId: req.body.storeId, poId: req.body.poId });
    if(grns && grns.length > 0)
      throw new Error("There is a GRN against this purchase order, so it cannot be deleted");

    await PurchaseOrder.findOneAndDelete({ _id: req.body.poId, storeId: req.body.storeId });
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
    const store = await Store.isManager(req.body.storeId, req.user._id);
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
       conditions.issueDate = { $gte: startMoment, $lte: endMoment };
    }
    
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await PurchaseOrder.countDocuments(conditions);
    
    const orders = await PurchaseOrder.find(conditions, null, { skip, limit: recordsPerPage, sort : { creationDate: -1 }  });

    res.json({
      orders,
      totalRecords
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/open', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");
    if(!req.query.supplierId) throw new Error("supplierId id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.query.storeId,
      supplierId: req.query.supplierId,
      status: poStates.PO_STATUS_OPEN
    }
    const orders = await PurchaseOrder.find(conditions, null, { sort : { creationDate: -1 }  });

    res.json({ orders })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store id is required");
    if(!req.query.supplierId) throw new Error("supplierId id is required");
    if(!req.query.poId) throw new Error("poId id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const conditions = {
      storeId: req.query.storeId,
      supplierId: req.query.supplierId,
      _id: req.query.poId
    }
    const order = await PurchaseOrder.findOne(conditions);

    res.json({ order })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


module.exports = router;