const router = require('express').Router();
const Store = require('../models/store/Store');
const AccountHead = require('../models/accounts/AccountHead');
const Bank = require('../models/accounts/Bank');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");

router.use(authCheck);

router.get('/banks', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const banks = await Bank.find({ storeId: store._id }, null, { sort: { creationDate: -1 } });
    res.json( banks );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.get('/accountHeads', async (req, res) => {
  try
  {
    if(!req.query.storeId) throw new Error("Store Id is required");
    
    const store = await Store.isStoreUser(req.query.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");
    await store.updateLastVisited();

    const heads = await AccountHead.find({ storeId: store._id }, null, { sort: { creationDate: -1 } });
    res.json( heads );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});





module.exports = router;