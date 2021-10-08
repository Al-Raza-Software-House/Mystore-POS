const router = require('express').Router();
const Store = require('../models/store/Store');
const Category = require('../models/stock/Category');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const { categoryTypes} = require('../utils/constants');
const Item = require( '../models/stock/Item' );
const { publicS3Object } = require( '../utils' );

router.use(authCheck);


router.post('/create', async (req, res) => {
  try
  {
    ['storeId', 'categoryId', 'itemCode', 'itemName'].forEach(item => {
      if(!req.body[item])
        throw new Error(item + ' is required');
    });
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 

    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    const now = moment().tz('Asia/Karachi').toDate();
    const defaultProperties = {
      property1: null,
      property2: null,
      property3: null,
      property4: null,
    }
    let record = {
      storeId: req.body.storeId,
      categoryId: req.body.categoryId,
      supplierId: req.body.supplierId,
      itemCode: req.body.itemCode,
      itemName: req.body.itemName,
      costPrice: req.body.costPrice ? req.body.costPrice : 0,
      salePrice: req.body.salePrice ? req.body.salePrice : 0,

      description: req.body.description,
      image: req.body.image,
      isServiceItem: req.body.isServiceItem,
      isActive: req.body.isActive,
      minStock: req.body.minStock ? req.body.minStock : 0,
      maxStock: req.body.maxStock ? req.body.maxStock : 0,
      currentStock: 0,
      varientParentId: null,
      packParentId: null,
      categoryPropertyValues: req.body.categoryPropertyValues ? req.body.categoryPropertyValues : defaultProperties,
      itemPropertyValues: req.body.itemPropertyValues ? req.body.itemPropertyValues : defaultProperties,
      expiryDate: req.body.expiryDate ? req.body.expiryDate : null,
      creationDate: now,
      lastUpdated: now,
    }
    const item = new Item(record);
    await item.save();
    if(req.body.variants)
      for(let index = 0; index < req.body.variants.length; index++)
      {
        let variantData = {
          sizeId: req.body.variants[index].sizeId,
          sizeCode: req.body.variants[index].sizeCode,
          sizeName: req.body.variants[index].sizeName,
          combinationId: req.body.variants[index].combinationId,
          combinationCode: req.body.variants[index].combinationCode,
          combinationName: req.body.variants[index].combinationName,
          costPrice: req.body.variants[index].costPrice ? req.body.variants[index].costPrice : item.costPrice,
          salePrice: req.body.variants[index].salePrice ? req.body.variants[index].salePrice : item.salePrice,
          minStock: req.body.variants[index].minStock ? req.body.variants[index].minStock : item.minStock,
          maxStock: req.body.variants[index].maxStock ? req.body.variants[index].maxStock : item.maxStock,
        }
        if(index === 0) //first variant is also Parent of all varients
        {
          item.set(variantData);
          await item.save();
          continue;
        }
        await new Item({
          ...record,
          ...variantData,
          varientParentId: item._id //first variant is also Parent of all varients
        }).save();
      }

    if(req.body.packings)
      for(let index = 0; index < req.body.packings.length; index++)
      {
        if(!req.body.packings[index].itemName) continue;
        await new Item({
          ...record,
          itemCode: item.itemCode + '-P' + (index+1),
          itemName: req.body.packings[index].itemName,
          packQuantity: req.body.packings[index].packQuantity,
          packSalePrice: req.body.packings[index].packSalePrice,
          packParentId: item._id
        }).save();
      }
    if(req.body.image)
    {
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/items/' + req.body.image;
      await publicS3Object( key );
    }
    res.json( item );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/isItemCodeTaken', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("store id is required");
    if(!req.query.itemCode) throw new Error("item Code is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 

    const itemExists = await Item.findOne({ storeId: req.query.storeId, itemCode: req.query.itemCode });
    
    res.json( { taken: itemExists ? true: false } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/search', async (req, res) => {
  try
  {
    if(!req.body.storeId)
      throw new Error("Store id is required");
    const store = await Store.isStoreUser(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const conditions = {
      storeId: req.body.storeId,
      varientParentId: null, //show one parent record if variant item
      packParentId: null // Do not show packings of item
    }
    const fields = {
      _id: 1,
      itemCode: 1,
      itemName: 1,
      categoryId: 1,
      costPrice: 1,
      salePrice: 1,
      currentStock: 1,
      creationDate: 1
    }
    const skip = req.body.skip ? req.body.skip : 0;
    const recordsPerPage = req.body.recordsPerPage ? req.body.recordsPerPage : 0;
    const totalRecords = await Item.countDocuments(conditions);
    
    const items = await Item.find(conditions, fields, { skip, limit: recordsPerPage, sort : { creationDate: -1 }  });

    res.json({
      totalRecords,
      items
    })
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;