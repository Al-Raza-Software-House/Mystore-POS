const router = require('express').Router();
const Store = require('../models/store/Store');
const Category = require('../models/stock/Category');
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
    if(req.query.categoryId)
      conditions._id = req.query.categoryId;
    
    const categories = await Category.find(conditions);
    res.json( req.query.categoryId ? categories[0] :  categories);
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.name) throw new Error("category name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    let itemCodePrefixExist = false;
    let itemCodePrefix = req.body.name.substr(0, 3).toUpperCase();
    do{
      if(itemCodePrefixExist)
        itemCodePrefix = itemCodePrefix + '9';
      itemCodePrefixExist = await Category.findOne({ storeId: req.body.storeId, itemCodePrefix });
    }while(itemCodePrefixExist);

    let record = {
      storeId: req.body.storeId,
      name: req.body.name,
      type: parseInt(req.body.type),
      notes: req.body.notes,
      itemCodePrefix: itemCodePrefix,
      itemCodeCursor: 1,
      sizes: [],
      combinations: [],
      property1: { name: "Sub Category", values: [] },
      property2: { name: "Property 2", values: [] },
      property3: { name: "Property 3", values: [] },
      property4: { name: "Property 4", values: [] },
    }
    const category = new Category(record);
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/update', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.name) throw new Error("category name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 

    category.name = req.body.name;
    category.type = req.body.type;
    category.notes = req.body.notes;

    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 

    const item = await Item.findOne({ storeId: req.body.storeId, categoryId: req.body.categoryId });
    if(item) 
      throw new Error("This category contains items so it cannot be deleted");

    await Category.findOneAndDelete({ _id: req.body.categoryId, storeId: req.body.storeId });
    res.json( { success: true } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//Manage Sizes
router.post('/addSize', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.code) throw new Error("Code is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 

    category.sizes.push({ code: req.body.code.toUpperCase(), title: req.body.title });
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/editSize', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.sizeId) throw new Error("sizeId is required");
    if(!req.body.code) throw new Error("Code is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    
    await Category.findOneAndUpdate(
      { _id: req.body.categoryId, storeId: req.body.storeId, 'sizes._id' : req.body.sizeId },
      {
        $set:{
          "sizes.$.code": req.body.code.toUpperCase(),
          "sizes.$.title": req.body.title
        }
      }
    );
    await Item.updateMany({ storeId: req.body.storeId, sizeId: req.body.sizeId }, { sizeCode: req.body.code, sizeName: req.body.title });
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/deleteSize', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.sizeId) throw new Error("sizeId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    
    const item = await Item.findOne({ storeId: req.body.storeId, sizeId: req.body.sizeId });
    if(item) 
      throw new Error("This size is being used by items");

    category.sizes.pull({ _id: req.body.sizeId });
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});


//Delete Combination
router.post('/addCombination', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.code) throw new Error("Code is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 

    category.combinations.push({ code: req.body.code.toUpperCase(), title: req.body.title });
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/editCombination', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.combinationId) throw new Error("combinationId is required");
    if(!req.body.code) throw new Error("Code is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    
    await Category.findOneAndUpdate(
      { _id: req.body.categoryId, storeId: req.body.storeId, 'combinations._id' : req.body.combinationId },
      {
        $set:{
          "combinations.$.code": req.body.code.toUpperCase(),
          "combinations.$.title": req.body.title
        }
      }
    );
    await Item.updateMany({ storeId: req.body.storeId, combinationId: req.body.combinationId }, { combinationCode: req.body.code, combinationName: req.body.title });

    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/deleteCombination', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.combinationId) throw new Error("combinationId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 

    const item = await Item.findOne({ storeId: req.body.storeId, combinationId: req.body.combinationId });
    if(item) 
      throw new Error("This color is being used by items");

    category.combinations.pull({ _id: req.body.combinationId });
    await category.save();
    res.json( category );
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
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.name) throw new Error("property name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    category[req.body.propertyId].name = req.body.name;
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/addPropertyValue', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    category[req.body.propertyId].values.push({ title: req.body.title });
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/editPropertyValue', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.valueId) throw new Error("valueId is required");
    if(!req.body.title) throw new Error("Title is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    
    await Category.findOneAndUpdate(
      { _id: req.body.categoryId, storeId: req.body.storeId, [`${req.body.propertyId}.values._id`] : req.body.valueId },
      {
        $set:{
          [`${req.body.propertyId}.values.$.title`] : req.body.title
        }
      }
    );
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/deletePropertyValue', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    if(!req.body.propertyId) throw new Error("propertyId is required");
    if(!req.body.valueId) throw new Error("valueId is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    
    const item = await Item.findOne({ storeId: req.body.storeId, [`categoryPropertyValues.${req.body.propertyId}`]: req.body.valueId });
    if(item) 
      throw new Error("This value is being used by items");
      
    category[req.body.propertyId].values.pull({ _id: req.body.valueId });
    await category.save();
    res.json( category );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/createItemCode', async (req, res) => {
  try{

    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.categoryId) throw new Error("category id is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 

    let itemCodePrefix = category.itemCodePrefix;
    let itemCodeCursor = category.itemCodeCursor;
    let newItemCode = itemCodePrefix + itemCodeCursor.toString().padStart(4, '0');
    let itemCodeExists = false;
    do{
      if(itemCodeExists)
      {
        itemCodeCursor++;
        newItemCode = itemCodePrefix + itemCodeCursor.toString().padStart(4, '0');
      }
      itemCodeExists = await Item.findOne({ storeId: req.body.storeId, itemCode: newItemCode });
    }while(itemCodeExists);

    category.itemCodeCursor = itemCodeCursor + 1;
    await category.save();

    res.json({ itemCode: newItemCode });


  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;