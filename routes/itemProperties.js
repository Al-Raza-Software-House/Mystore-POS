const router = require('express').Router();
const Store = require('../models/store/Store');
const ItemProperty = require('../models/stock/ItemProperty');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const Item = require( '../models/stock/Item' );

router.use(authCheck);

router.get('/', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
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

    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 
    properties[req.body.propertyId].name = req.body.name;
    await properties.save();
    res.json( properties );
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
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 
    properties[req.body.propertyId].values.push({ title: req.body.title });
    await properties.save();
    res.json( properties );
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
    
    await ItemProperty.findOneAndUpdate(
      { storeId: req.body.storeId, [`${req.body.propertyId}.values._id`] : req.body.valueId },
      {
        $set:{
          [`${req.body.propertyId}.values.$.title`] : req.body.title
        }
      }
    );
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 
    res.json( properties );
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
    const properties = await ItemProperty.findOne({ storeId: req.body.storeId });
    if(!properties) throw new Error("invalid Request"); 

    const item = await Item.findOne({ storeId: req.body.storeId, [`itemPropertyValues.${req.body.propertyId}`]: req.body.valueId });
    if(item) 
      throw new Error("This value is being used by items");

    properties[req.body.propertyId].values.pull({ _id: req.body.valueId });
    await properties.save();
    res.json( properties );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;