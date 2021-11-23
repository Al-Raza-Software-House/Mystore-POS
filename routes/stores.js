const router = require('express').Router();
const Store = require('../models/store/Store');
const User = require('../models/system/User');
const moment = require('moment-timezone');
const bcrypt = require('bcryptjs');
const { authCheck } = require('../utils/middlewares');
const { storeStates, userRoles, accountHeadTypes } = require('../utils/constants');
const mongoose = require('mongoose');
const ItemProperty = require( '../models/stock/ItemProperty' );
const AdjustmentReason = require( '../models/stock/AdjustmentReason' );
const Bank = require( '../models/accounts/Bank' );
const AccountHead = require( '../models/accounts/AccountHead' );
const DeleteActivity = require( '../models/store/DeleteActivity' );

router.use(authCheck);

//get user's stores list
router.get('/', async (req, res) => {
  try
  {
    let conditions = { 
      'users.userId': req.user._id,
      status: storeStates.STORE_STATUS_ACTIVE
    }

    if(req.query.storeId)
      conditions._id = req.query.storeId;
    const stores = await Store.find(conditions).populate('users.record', 'name phone profilePicture');
    res.json(req.query.storeId ? stores[0] : stores);
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


//delete store - only owner allowed with password
router.post('/delete', async (req, res) => {
  try{
    if(!req.body.id) throw new Error("Store id is required");
    if(!req.body.password) throw new Error("Password is required");
    
    const user = await User.findById(req.user._id);
    if(user === null || !(await bcrypt.compare(req.body.password, user.password)) )
      throw new Error("Invalid Password");

    if(!(await Store.isOwner(req.body.id, req.user._id) ))
      throw new Error("Invalid Request");
    const now = moment().tz('Asia/Karachi').toDate();
    const record = {
      status: storeStates.STORE_STATUS_DELETED,
      lastVisited: now,
      lastActivity: now,
      lastUpdated: now,
    }
    await Store.findByIdAndUpdate(req.body.id, record);
    res.json({ success: true });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//create store 
router.post('/create', async (req, res) => {
  try{
    if(!req.body.storeName) throw new Error("Store name is required");
    if(!req.body.businessType) throw new Error("Business type is required");
    
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      name: req.body.storeName,
      phone1: req.body.phone1,
      phone2: "",
      city: req.body.city,
      address: req.body.address,
      businessType: req.body.businessType,
      status: storeStates.STORE_STATUS_ACTIVE,
      
      creationDate: now,
      openingDate: null,
      lastVisited: now,
      lastActivity: now,
      lastUpdated: now,
      lastPayment: null,
      lastEndOfDay: null,
      expiryDate: moment().tz('Asia/Karachi').add(process.env.TRIAL_PERIOD, 'days').toDate(),

      monthlyPricing: process.env.STORE_PRICING,
      'currency': 'PKR',
      users: [{
        userId: mongoose.Types.ObjectId(req.user._id),
        userRole: userRoles.USER_ROLE_OWNER,
        isCreator: true
      }],
      registors:[{
        code: '001',
        name: 'default',
        notes: ''
      }],
      receiptSettings: {
        printSalesReceipt: true
      },
      dataUpdated: {
        stores: now,
        videos: now,
        itemProperties: now,
        categories: now,
        items: now,
        adjustmentReasons: now,
        suppliers: now,
        customers: now,
        banks: now,
        accountHeads: now,
        deleteActivity: now
      }
    }
    
    const newStore = await new Store(record).save();
    //create default item properties
    let itemProperties = {
      storeId: newStore._id,
      property1: { name: "Property 1", values: [] },
      property2: { name: "Property 2", values: [] },
      property3: { name: "Property 3", values: [] },
      property4: { name: "Property 4", values: [] },
      creationDate: now,
      lastVisited: now,
    }

    const properties = new ItemProperty(itemProperties);
    await properties.save();
    //create default adjustment reasons
    const reason = {
      storeId: newStore._id,
      name: "Theft",
      notes: "",
      default: true,
      creationDate: now,
      lastUpdated: now
    }

    await new AdjustmentReason(reason).save();
    reason.name = "Broken";
    await new AdjustmentReason(reason).save();
    const reasons = await AdjustmentReason.find({ storeId: newStore._id });

    //create default Banks
    const bank = {
      storeId: newStore._id,
      name: "Easypaisa",
      default: true, // will be selected bank in dropdown
      notes: "",
      default: true,
      creationDate: now,
      lastUpdated: now,
      lastTransaction: null
    }
    await new Bank(bank).save();
    bank.name = "JazzCash";
    bank.default = false;
    await new Bank(bank).save();
    bank.name = "HBL";
    await new Bank(bank).save();
    const banks = await Bank.find({storeId: newStore._id});

    //create default account Heads
    const headRecord = {
      storeId: newStore._id,
      notes: "",
      creationDate: now,
      lastUpdated: now,
      lastTransaction: null
    }
    const accountHeadIds = {  };//save ids of heads created below in store, to make a system txn against a head
    const headNames = [
      //only system will log transcation against the head
      { name: "Sales", editAble: false, systemHead: true, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME },
      { name: "Purchase", editAble: false, systemHead: true, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL },
      { name: "Customer Receipt", editAble: false, systemHead: true, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL },
      { name: "Supplier Payment", editAble: false, systemHead: true, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL },
      //user will log transaction against the head
      { name: "Bank Account", editAble: false, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL  },
      { name: "Misc Income", editAble: false, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_INCOME  },
      { name: "Expense", editAble: false, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_EXPENSE  },
      { name: "Other", editAble: false, systemHead: false, type: accountHeadTypes.ACCOUNT_HEAD_TYPE_GENERAL  },
    ]
    for(let i=0; i<headNames.length; i++)
    {
      let newHead = new AccountHead({ ...headRecord, ...headNames[i] });
      await newHead.save();
      accountHeadIds[ headNames[i].name.replace(/\s+/g, '') ] = newHead._id;
    }

    let storeAccountHeads = await AccountHead.find({ storeId: newStore._id });
    newStore.set('accountHeadIds', accountHeadIds);
    await newStore.save();

    let store = await Store.findById(newStore._id).populate('users.record', 'name phone profilePicture');
    res.json({
      store,
      itemProperties: properties,
      adjustmentReasons: reasons,
      banks,
      accountHeads: storeAccountHeads
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//update store general info
router.post('/update', async (req, res) => {
  try{
    if(!req.body.id) throw new Error("Store id is required");
    if(!req.body.name) throw new Error("Store name is required");
    
    if(!(await Store.isManager(req.body.id, req.user._id) ))
      throw new Error("Invalid Request");
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      name: req.body.name,
      phone1: req.body.phone1,
      phone2: req.body.phone2,
      city: req.body.city,
      address: req.body.address,
    }
    
    await Store.findByIdAndUpdate(req.body.id, record, { runValidators: true });    
    let store = await Store.findById(req.body.id).populate('users.record', 'name phone profilePicture');
    await store.updateLastUpdated();
    await store.logCollectionLastUpdated('stores', now);
    res.json({
      store,
      now
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//update store receipt settings
router.post('/receipt', async (req, res) => {
  try{
    if(!req.body.id) throw new Error("Store id is required");
    let store = await Store.findById(req.body.id);    
    if(store === null)
      throw new Error("Invalid request");
    const now = moment().tz('Asia/Karachi').toDate();
    if(!(await Store.isManager(req.body.id, req.user._id) ))
      throw new Error("Invalid Request");
    
    await Store.findByIdAndUpdate(req.body.id, { receiptSettings: req.body.receiptSettings }, { runValidators: true });    
    store = await Store.findById(req.body.id).populate('users.record', 'name phone profilePicture');
    await store.updateLastUpdated();
    await store.logCollectionLastUpdated('stores', now);
    res.json({
      store,
      now
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//update store configuration
router.post('/configuration', async (req, res) => {
  try{
    if(!req.body.id) throw new Error("Store id is required");
    let store = await Store.findById(req.body.id);    
    if(store === null)
      throw new Error("Invalid request");
    const now = moment().tz('Asia/Karachi').toDate();
    if(!(await Store.isManager(req.body.id, req.user._id) ))
      throw new Error("Invalid Request");
    
    await Store.findByIdAndUpdate(req.body.id, { configuration: req.body.configuration }, { runValidators: true });    
    store = await Store.findById(req.body.id).populate('users.record', 'name phone profilePicture');
    await store.updateLastUpdated();
    await store.logCollectionLastUpdated('stores', now);
    res.json({
      store,
      now
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//Add new user to store
router.post('/adduser', async (req, res) => {
  try{
    if(!req.body.id) throw new Error("Store id is required");
    if(!req.body.userRole) throw new Error("Name is required");
    if(!req.body.name) throw new Error("Name is required");
    if(!req.body.phone) throw new Error("Mobile number is required");

    if(!(await Store.isManager(req.body.id, req.user._id) ))
      throw new Error("Invalid Request");
    const now = moment().tz('Asia/Karachi').toDate();
    let store = null;
    let user = await User.findOne({ phone: req.body.phone, status: { $gte: 1 } });
    if(user === null)// new user, create user first via Signup API
    {
      res.json({ newUser: true }); 
    }else
    {
      store = await Store.findOne({ _id: req.body.id, 'users.userId' :  user._id });
      if(store === null) // if user not already added to the store
        await Store.findByIdAndUpdate( req.body.id, { $push: { users: { userId: user._id, userRole: req.body.userRole } } } );
      
      store = await Store.findById(req.body.id).populate('users.record', 'name phone profilePicture');
      await store.updateLastUpdated();
      await store.logCollectionLastUpdated('stores', now);
      res.json({
        store,
        now
      });
    }
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//Add new user to store
router.post('/removeUser', async (req, res) => {
  try{
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.userId) throw new Error("User id is required");
    
    if(!(await Store.isManager(req.body.storeId, req.user._id) ))
      throw new Error("Invalid Request");
    const now = moment().tz('Asia/Karachi').toDate();
    await Store.findByIdAndUpdate(req.body.storeId, { $pull: { users: {userId: req.body.userId} } });
    let store = await Store.findById(req.body.storeId).populate('users.record', 'name phone profilePicture');
    await store.updateLastUpdated();
    await store.logCollectionLastUpdated('stores', now);
    res.json({
      store,
      now
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//Add new user to store
router.post('/updateUser', async (req, res) => {
  try{
    if(!req.body.storeId) throw new Error("Store id is required");
    if(!req.body.userId) throw new Error("User id is required");
    if(!req.body.userRole) throw new Error("User role is required");
    
    if(!(await Store.isManager(req.body.storeId, req.user._id) ))
      throw new Error("Invalid Request");
    const now = moment().tz('Asia/Karachi').toDate();
    await Store.updateOne({ _id: req.body.storeId, 'users.userId': req.body.userId }, { $set: { "users.$.userRole": req.body.userRole } });
    let store = await Store.findById(req.body.storeId).populate('users.record', 'name phone profilePicture');
    await store.updateLastUpdated();
    await store.logCollectionLastUpdated('stores', now);
    res.json({
      store,
      now
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//Add new user to store
router.get('/getUpdateTimestamps', async (req, res) => {
  try{
    if(!req.query.storeId) throw new Error("Store id is required");
    let store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store)
    {
      res.json({ storeId: null }); 
      return;
    }
    res.json({
      storeId: store._id,
      appVersion: process.env.APP_VERSION,
      lastEndOfDay: store.lastEndOfDay,
      dataUpdated: store.dataUpdated
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


router.get('/deleteActivity', async (req, res) => {
  try{
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    await store.updateLastVisited();

    const conditions = {
      storeId: store._id
    }
    if(req.query.after)
    {
      conditions.time = {
        $gt: moment(req.query.after).toDate()
      }
    }
    const records = await DeleteActivity.find(conditions);

    res.json(records)
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;
