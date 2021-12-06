const router = require('express').Router();
const Store = require('../models/store/Store');
const Category = require('../models/stock/Category');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const { categoryTypes, itemTypesFilter} = require('../utils/constants');
const Item = require( '../models/stock/Item' );
const { publicS3Object, deleteS3Object } = require( '../utils' );
const StockTransactions = require( '../models/stock/StockTransactions' );
const DeleteActivity = require('../models/store/DeleteActivity');

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
    const lastAction = store.dataUpdated.items;
    const category = await Category.findOne({ _id: req.body.categoryId, storeId: req.body.storeId });
    if(!category) throw new Error("invalid Request"); 
    
    const itemExists = await Item.findOne({ storeId: req.body.storeId, itemCode: req.body.itemCode });
    if(itemExists) throw new Error("This item code is already taken");
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
      supplierId: req.body.supplierId ? req.body.supplierId : null,
      itemCode: req.body.itemCode,
      itemName: req.body.itemName,
      costPrice: req.body.costPrice ? req.body.costPrice : 0,
      salePrice: req.body.salePrice ? req.body.salePrice : 0,

      description: req.body.description ? req.body.description : '',
      image: req.body.image,
      isServiceItem: req.body.isServiceItem ? true : false,
      isActive: true,
      minStock: req.body.minStock ? req.body.minStock : 0,
      maxStock: req.body.maxStock ? req.body.maxStock : 0,
      currentStock: 0,
      varientParentId: null,
      packParentId: null,
      categoryPropertyValues: req.body.categoryPropertyValues ? req.body.categoryPropertyValues : defaultProperties,
      itemPropertyValues: req.body.itemPropertyValues ? req.body.itemPropertyValues : defaultProperties,
      expiryDate: null,
      creationDate: now,
      lastUpdated: now,
    }
    let item = new Item(record);
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
          itemCode: req.body.packings[index].itemCode,
          itemName: req.body.packings[index].itemName,
          packQuantity: req.body.packings[index].packQuantity ? req.body.packings[index].packQuantity : 0,
          packSalePrice: req.body.packings[index].packSalePrice ? req.body.packings[index].packSalePrice : 0,
          packParentId: item._id
        }).save();
      }
    if(req.body.image)
    {
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/items/' + req.body.image;
      await publicS3Object( key );
    }
    item = item.toObject();
    item.packings = await Item.find({ storeId: item.storeId, packParentId: item._id });
    item.variants = await Item.find({ storeId: item.storeId, varientParentId: item._id });
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('items', now);
    res.json( {
      item,
      now,
      lastAction
    } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/update', async (req, res) => {
  try
  {
    ['storeId', '_id', 'itemName'].forEach(item => {
      if(!req.body[item])
        throw new Error(item + ' is required');
    });
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid request");
    const lastAction = store.dataUpdated.items;
    let item = await Item.findById(req.body._id);
    
    if(!item || item.storeId.toString() !== store._id.toString()) throw new Error("invalid request");
    const now = moment().tz('Asia/Karachi').toDate();

    let category = await Category.findById(item.categoryId);

    if(req.body.image && item.image !== req.body.image) // uploaded new image, 
    {
      if(item.image) // if item has old image , delete old image
        await deleteS3Object( process.env.AWS_KEY_PREFIX + req.body.storeId + '/items/' + item.image );
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/items/' + req.body.image;
      await publicS3Object( key );
    }
    
    let record = {
      itemName: req.body.itemName,
      supplierId: req.body.supplierId ? req.body.supplierId : null,
      costPrice: req.body.costPrice ? req.body.costPrice : 0,
      salePrice: req.body.salePrice ? req.body.salePrice : 0,
      minStock: req.body.minStock ? req.body.minStock : 0,
      maxStock: req.body.maxStock ? req.body.maxStock : 0,
      description: req.body.description ? req.body.description : '',
      isServiceItem: req.body.isServiceItem ? true : false,
      isActive: req.body.isActive ? true : false,
      image: req.body.image,
      categoryPropertyValues: req.body.categoryPropertyValues,
      itemPropertyValues: req.body.itemPropertyValues,
      lastUpdated: now,
    }
    item.set(record)
    await item.save();
    
    //Update variants or packings, 
    let deletedSubItems = [];
    if(category.type === categoryTypes.CATEGORY_TYPE_VARIANT)
    {
      //Delete Variants
      const currentVariantIds = []; //coming from browser
      if(req.body.variants)
        for(let index = 0; index < req.body.variants.length; index++)
        {
          if(req.body.variants[index]._id) currentVariantIds.push(req.body.variants[index]._id); //collect ids of old packings that weren't deleted by user
        }
      
      let oldVariants = await Item.find({ storeId: item.storeId, varientParentId: item._id });
      for(let index = 0; index < oldVariants.length; index++)
      {
        if(!currentVariantIds.includes( oldVariants[index]._id.toString() )) 
        {
          //sub-variant Deleted by the user
          await new DeleteActivity({ 
              storeId: req.body.storeId,
              recordId: oldVariants[index]._id,
              collectionName: 'items',
              time: now
          }).save();
          deletedSubItems.push(oldVariants[index]._id);
          await store.logCollectionLastUpdated('deleteActivity');
          await Item.findByIdAndDelete( oldVariants[index]._id );
        }
      }

      if(!currentVariantIds.includes( item._id.toString() )) //parent Variant is also deleted by the user, delete and make another parent
      {
        await new DeleteActivity({ 
            storeId: req.body.storeId,
            recordId: item._id,
            collectionName: 'items',
            time: now
        }).save();
        deletedSubItems.push(item._id);
        await store.logCollectionLastUpdated('deleteActivity');
        await Item.findByIdAndDelete( item._id );
        item = null;//set it null to create new parent in the loop
      } 
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
            costPrice: req.body.variants[index].costPrice ? req.body.variants[index].costPrice : (item && item.costPrice ? item.costPrice : 0),
            salePrice: req.body.variants[index].salePrice ? req.body.variants[index].salePrice : (item && item.salePrice ? item.salePrice : 0),
            minStock: req.body.variants[index].minStock ? req.body.variants[index].minStock : (item && item.minStock ? item.minStock : 0),
            maxStock: req.body.variants[index].maxStock ? req.body.variants[index].maxStock : (item && item.maxStock ? item.maxStock : 0),
          }
          if(index === 0) //first variant is also Parent of all varients
          {
            if(req.body.variants[index]._id) //old variant
            {
              if(item) //parent varient not deleted
                await Item.findByIdAndUpdate(req.body.variants[index]._id, {...record, ...variantData});
              else //parent varient deleted, make first old varient as parent 
              {
                item = await Item.findById(req.body.variants[index]._id);
                item.set({
                  ...record,
                  ...variantData,
                  packParentId: null,
                  varientParentId: null
                });
                await item.save(); 
              }
            }else // new variant added by user
            {
              if(item) //  0 probablity case, as If parent exist, first variant is not new but always parent
              {
                await new Item({
                  storeId: item.storeId,
                  categoryId: item.categoryId,
                  itemCode: item.itemCode,
                  currentStock: 0,
                  creationDate: item.creationDate,
                  expiryDate: null,
                  ...record,
                  ...variantData,
                  varientParentId: item._id //first variant is also Parent of all varients
                }).save();
              }else
              {
                item = new Item({
                  storeId: req.body.storeId,
                  categoryId: req.body.categoryId,
                  itemCode: req.body.itemCode,
                  currentStock: 0,
                  creationDate: (new moment(req.body.creationDate) ).toDate(),
                  expiryDate: null,
                  ...record,
                  ...variantData,
                  packParentId: null,
                  varientParentId: null
                });
                await item.save();
              }
            }
            continue;
          }
          //all other variants except first
          if(req.body.variants[index]._id)
          {
            await Item.findByIdAndUpdate(req.body.variants[index]._id, {...record, ...variantData, varientParentId: item._id}); //parent might change
          }else
          {
            await new Item({
              storeId: req.body.storeId,
              categoryId: req.body.categoryId,
              itemCode: req.body.itemCode,
              currentStock: 0,
              creationDate: (new moment(req.body.creationDate) ).toDate(),
              expiryDate: null,
              ...record,
              ...variantData,
              varientParentId: item._id, //first variant is also Parent of all varients
              packParentId: null
            }).save();
          }
        }
    }else //standard category
    {
      //Delete Packings
      const currentPackIds = [];
      if(req.body.packings)
        for(let index = 0; index < req.body.packings.length; index++)
        {
          if(req.body.packings[index]._id) currentPackIds.push(req.body.packings[index]._id); //collect ids of old packings that weren't deleted by user
        }
      
      let oldPackings = await Item.find({ storeId: item.storeId, packParentId: item._id });
      for(let index = 0; index < oldPackings.length; index++)
      {
        if(!currentPackIds.includes( oldPackings[index]._id.toString() ))
        {
          await new DeleteActivity({ 
              storeId: req.body.storeId,
              recordId: oldPackings[index]._id,
              collectionName: 'items',
              time: now
          }).save();
          deletedSubItems.push(oldPackings[index]._id);
          await store.logCollectionLastUpdated('deleteActivity');
          await Item.findByIdAndDelete( oldPackings[index]._id );
        }
      }
      //Update or add new packings
      if(req.body.packings)
        for(let index = 0; index < req.body.packings.length; index++)
        {
          if(!req.body.packings[index].itemName) continue;
          if(req.body.packings[index]._id) //old packing updated
          {
            await Item.findByIdAndUpdate(req.body.packings[index]._id, {
              ...record, 
              itemName: req.body.packings[index].itemName,
              packQuantity: req.body.packings[index].packQuantity ? req.body.packings[index].packQuantity : 0,
              packSalePrice: req.body.packings[index].packSalePrice ? req.body.packings[index].packSalePrice : 0,
            });
          }else // new Packing added
          {
            await new Item({
              ...record,
              storeId: item.storeId,
              categoryId: item.categoryId,
              itemCode: req.body.packings[index].itemCode,
              itemName: req.body.packings[index].itemName,
              currentStock: 0,
              packQuantity: req.body.packings[index].packQuantity,
              packSalePrice: req.body.packings[index].packSalePrice,
              varientParentId: null,
              packParentId: item._id,
              expiryDate: null,
              creationDate: now
            }).save();
          }
        }
    }
    item = item.toObject();
    item.packings = await Item.find({ storeId: item.storeId, packParentId: item._id });
    item.variants = await Item.find({ storeId: item.storeId, varientParentId: item._id });

    await store.updateLastActivity();
    await store.logCollectionLastUpdated('items', now);
    res.json( {
      item,
      now,
      lastAction,
      deletedSubItems
    } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/isItemCodeTaken', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("store id is required");
    if(!req.query.codes) throw new Error("item codes are required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    let response = {  };
    for(let index = 0; index < req.query.codes.length; index++)
    {
      const itemExists = await Item.findOne({ storeId: req.query.storeId, itemCode: req.query.codes[index] });
      response[ req.query.codes[index] ] = itemExists ? true: false;
    }
    
    res.json( { codes: response } );
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
    await store.updateLastVisited();

    const conditions = {
      storeId: req.body.storeId,
      varientParentId: null, //show one parent record if variant item
      packParentId: null // Do not show packings of item
    }
    if(req.body.itemCode)
      conditions.itemCode = {$regex : '.*' + req.body.itemCode + '.*' };
    if(req.body.itemName)
      conditions.itemName = {$regex : '.*' + req.body.itemName + '.*' };
    if(req.body.categoryId)
      conditions.categoryId = req.body.categoryId;
    if(req.body.supplierId)
      conditions.supplierId = req.body.supplierId;

    if(req.body.itemType)
    {
      switch(req.body.itemType)
      {
        case itemTypesFilter.LOW_STOCK_ITEMS:
          conditions['$expr'] = { $lt: ["$currentStock", "$minStock"] };
          break;
        case itemTypesFilter.OVER_STOCK_ITEMS:
          conditions['$expr'] = { $gt: ["$currentStock", "$maxStock"] };
          break;
        case itemTypesFilter.EXPIRED_ITEMS:
          const now = moment().tz('Asia/Karachi').toDate();
          conditions.expiryDate = { $lt: now };
          break;
        case itemTypesFilter.SERVICE_ITEMS:
          conditions.isServiceItem = true;
          break;
        case itemTypesFilter.ACTIVE_ITEMS:
          conditions.isActive = true;
          break;
        case itemTypesFilter.INACTIVE_ITEMS:
          conditions.isActive = false;
          break;
        default:
          break;
      }
    } 
    if(!req.body.itemPropertyValues) req.body.itemPropertyValues = {};
    if(req.body.itemPropertyValues.property1) conditions['itemPropertyValues.property1'] = req.body.itemPropertyValues.property1;
    if(req.body.itemPropertyValues.property2) conditions['itemPropertyValues.property2'] = req.body.itemPropertyValues.property2;
    if(req.body.itemPropertyValues.property3) conditions['itemPropertyValues.property3'] = req.body.itemPropertyValues.property3;
    if(req.body.itemPropertyValues.property4) conditions['itemPropertyValues.property4'] = req.body.itemPropertyValues.property4;

    if(!req.body.categoryPropertyValues) req.body.categoryPropertyValues = {};
    if(req.body.categoryPropertyValues.property1) conditions['categoryPropertyValues.property1'] = req.body.categoryPropertyValues.property1;
    if(req.body.categoryPropertyValues.property2) conditions['categoryPropertyValues.property2'] = req.body.categoryPropertyValues.property2;
    if(req.body.categoryPropertyValues.property3) conditions['categoryPropertyValues.property3'] = req.body.categoryPropertyValues.property3;
    if(req.body.categoryPropertyValues.property4) conditions['categoryPropertyValues.property4'] = req.body.categoryPropertyValues.property4;
    

    const fields = {
      _id: 1,
      itemCode: 1,
      itemName: 1,
      categoryId: 1,
      costPrice: 1,
      salePrice: 1,
      currentStock: 1,
      creationDate: 1,
      isServiceItem: 1
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

router.post('/delete', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.itemId) throw new Error("Item id is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    const lastAction = store.dataUpdated.deleteActivity;
    const item = await Item.findOne({ storeId: req.body.storeId, _id: req.body.itemId });
    if(!item) throw new Error("Item not found");
    //if parent has transactions or if packing has transaction, pack transaction has parent itemId 
    let txns = await StockTransactions.countDocuments({ storeId: req.body.storeId, itemId: req.body.itemId });
    if(txns) throw new Error("This item has stock transcations so it cannot be deleted");

    //if any variant has transcations
    let variants = await Item.find({ storeId: item.storeId, varientParentId: item._id });                    
    for(let index = 0; index < variants.length; index++)
    {
      txns = await StockTransactions.countDocuments({ storeId: variants[index].storeId, itemId: variants[index]._id });
      if(txns) throw new Error("This item has stock transcations so it cannot be deleted");
    }
    //log delete Activity to sync between devices
    const now = moment().tz('Asia/Karachi').toDate();
    for(let index = 0; index < variants.length; index++)
    {
      await new DeleteActivity({ 
        storeId: req.body.storeId,
        recordId: variants[index]._id,
        collectionName: 'items',
        time: now
      }).save();
    }
    let packings = await Item.find({ storeId: item.storeId, packParentId: item._id });
    for(let index = 0; index < packings.length; index++)
    {
      await new DeleteActivity({ 
        storeId: req.body.storeId,
        recordId: packings[index]._id,
        collectionName: 'items',
        time: now
      }).save();
    }

    
    if(item.image)
    {
      let key = process.env.AWS_KEY_PREFIX + req.body.storeId + '/items/' + item.image;
      await deleteS3Object( key );
    }
    await Item.deleteMany({ storeId: req.body.storeId, varientParentId: item._id }); //delete all variants
    await Item.deleteMany({ storeId: req.body.storeId, packParentId: item._id }); //delete all packings

    await Item.findOneAndDelete({ _id: req.body.itemId, storeId: req.body.storeId });
    await store.updateLastActivity();
    
    
    await new DeleteActivity({ 
      storeId: req.body.storeId,
      recordId: req.body.itemId,
      collectionName: 'items',
      time: now
     }).save();
    await store.logCollectionLastUpdated('deleteActivity', now);

    res.json( { success: true, now, lastAction } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//get single item
router.get('/load', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    if(!req.query.itemId) throw new Error("Item id is required");
    const store = await Store.isManager(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    await store.updateLastVisited();
    
    let item = await Item.findOne({ storeId: req.query.storeId, _id: req.query.itemId });
    if(!item) throw new Error("invalid request");
    item = item.toObject();
    let category = await Category.findById(item.categoryId);

    item.packings = []; item.variants = []; item.sizes = []; item.combinations = [];
    if(category.type === categoryTypes.CATEGORY_TYPE_STANDARD)
    {
      let packings = await Item.find({ storeId: item.storeId, packParentId: item._id });
      for(let index = 0; index < packings.length; index++)
      {
        txns = await StockTransactions.countDocuments({ storeId: item.storeId, itemId: item._id, packId: packings[index]._id });
        let pack = packings[index].toObject();
        pack.preventDelete = txns > 0; //get records from SALE_ITEMS collection
        item.packings.push(pack);
      }
    }else
    {
      let txns = await StockTransactions.countDocuments({ storeId: item.storeId, itemId: item._id });

      if(item.sizeId) item.sizes.push({
        _id: item.sizeId,
        code: item.sizeCode,
        title: item.sizeName,
        preventDelete: txns > 0      
      });
      if(item.combinationId) item.combinations.push({
        _id: item.combinationId,
        code: item.combinationCode,
        title: item.combinationName,
        preventDelete: txns > 0    
      });
      //create a varient from Parent Varient
      const { _id, itemName, itemCode,  sizeId, sizeName, sizeCode, combinationId, combinationName, combinationCode, costPrice, salePrice, minStock, maxStock, currentStock } = item;
      const parentVarient = { _id, itemName, itemCode, sizeId, sizeName, sizeCode, combinationId, combinationName, combinationCode, costPrice, salePrice, minStock, maxStock, currentStock };
      item.variants.push( parentVarient );//item itself is a varient
      let variants = await Item.find({ storeId: item.storeId, varientParentId: item._id });                    
      for(let index = 0; index < variants.length; index++)
      {
        let variant = variants[index].toObject();
        txns = await StockTransactions.countDocuments({ storeId: variant.storeId, itemId: variant._id });
        
        item.variants.push(variant);
        let sizeExist = item.sizes.find(size => size._id.toString() === variant.sizeId.toString());
        if(!sizeExist) item.sizes.push( {
          _id: variant.sizeId,
          code: variant.sizeCode,
          title: variant.sizeName,
          preventDelete: txns > 0 
        });
        else if(txns > 0)
         item.sizes = item.sizes.map(size => size._id.toString() === variant.sizeId.toString() ? {...size, preventDelete: true} : size);

        let combinationExist = item.combinations.find(combination => combination._id.toString() === variant.combinationId.toString());
        
        if(!combinationExist) item.combinations.push( {
          _id: variant.combinationId,
          code: variant.combinationCode,
          title: variant.combinationName,
          preventDelete: txns > 0 
        })
        else if(txns > 0)
         item.combinations = item.combinations.map(combination => combination._id.toString() === variant.combinationId.toString() ? {...combination, preventDelete: true} : combination);
      }
    }
    res.json( {item} );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/adjustStock', async (req, res) => {
  try
  {
    ['storeId', 'itemId'].forEach(item => {
      if(!req.body[item])
        throw new Error(item + ' is required');
    });
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid request");
    const lastAction = store.dataUpdated.items;
    let item = await Item.findById(req.body.itemId);
    
    if(!item || item.storeId.toString() !== store._id.toString()) throw new Error("invalid request");
    const now = moment().tz('Asia/Karachi').toDate();

    const records = req.body.records;
    const items = [];
    for(let index = 0; index < records.length; index++)
    {
      items[index] = await Item.findById(records[index]._id);
      //log Stock TXN
      await new StockTransactions({
        storeId: store._id,
        userId: req.user._id,
        itemId: items[index]._id,
        reasonId: records[index].adjustmentReason,
        quantity: Number( records[index].adjustmentQuantity ),
        notes: req.body.notes ? req.body.notes : "",
        time: now
      }).save();
      //update current stock
      items[index].lastUpdated = now;
      items[index].currentStock = items[index].currentStock + Number( records[index].adjustmentQuantity );
      await items[index].save();
    }
    await store.updateLastActivity();
    await store.logCollectionLastUpdated('items', now);
    res.json( {
      items,
      now,
      lastAction
    } );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

//get Master Data all item

router.get('/allItems', async (req, res) => {
  try{
    if(!req.query.storeId) throw new Error("Store Id is required");
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request"); 
    await store.updateLastVisited();

    const skip = parseInt(req.query.skip ? req.query.skip : 0);
    const recordsPerPage = process.env.MASTER_DATA_RECORDS_PER_PAGE;
    const conditions = {
      storeId: store._id
    }
    if(req.query.after)
    {
      conditions.lastUpdated = {
        $gt: moment(req.query.after).toDate()
      }
    }
    let items = [];
    let hasMoreRecords = false;
    const totalRecords = await Item.countDocuments(conditions);
    if(skip < totalRecords)
    {
      items = await Item.find(conditions, null, { skip, limit: parseInt(recordsPerPage), sort : { creationDate: -1 } });
      if((skip + items.length) < totalRecords )
        hasMoreRecords = true;
    }

    res.json({
      items,
      totalRecords,
      hasMoreRecords
    })

  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

module.exports = router;