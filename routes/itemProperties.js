const router = require('express').Router();
const Store = require('../models/store/Store');
const ItemProperty = require('../models/stock/ItemProperty');
const { authCheck } = require('../utils/middlewares');
const Item = require( '../models/stock/Item' );
const moment = require("moment-timezone");

router.use(authCheck);

router.get('/', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();
    let conditions = { storeId: req.query.storeId };
    
    const properties = await ItemProperty.findOne(conditions);
    res.json( properties );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//Manage Category Properties
router.post('/editPropertyName', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.name) throw new Error("property name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.itemProperties;
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 
    properties[req.body.propertyId].name = req.body.name;
    await properties.save();
    const now = moment().tz('Asia/Karachi').toDate();
    await properties.updateLastUpdated();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('itemProperties', now);
    res.json({
      properties,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/addPropertyValue', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.itemProperties;
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 
    properties[req.body.propertyId].values.push({ title: req.body.title });
    await properties.save();
    const now = moment().tz('Asia/Karachi').toDate();
    await properties.updateLastUpdated();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('itemProperties', now);
    res.json({
      properties,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/editPropertyValue', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.valueId) throw new Error("valueId is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.itemProperties;
    await ItemProperty.findOneAndUpdate(
      { storeId: req.body.storeId, [`${req.body.propertyId}.values._id`] : req.body.valueId },
      {
        $set:{
          [`${req.body.propertyId}.values.$.title`] : req.body.title
        }
      }
    );
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    await properties.updateLastUpdated();
    if(!properties) throw new Error("invalid Request"); 
    const now = moment().tz('Asia/Karachi').toDate();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('itemProperties', now);
    res.json({
      properties,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/deletePropertyValue', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.valueId) throw new Error("valueId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.itemProperties;
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 

    const item = await Item.findOne({ storeId: req.body.storeId, [`itemPropertyValues.${req.body.propertyId}`]: req.body.valueId });
    if(item) 
      throw new Error("This value is being used by items");

    properties[req.body.propertyId].values.pull({ _id: req.body.valueId });
    await properties.save();
    const now = moment().tz('Asia/Karachi').toDate();
    await properties.updateLastUpdated();
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('itemProperties', now);
    res.json({
      properties,
      now,
      lastAction
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;