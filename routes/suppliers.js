const router = require('express').Router();
const Store = require('../models/store/Store');
const Supplier = require('../models/parties/Supplier');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");

router.use(authCheck);

router.post('/create', async (req, res) => {
  try
  {
    if(!req.body.storeId) throw new Error("Store Id is required");
    if(!req.body.name) throw new Error("supplier name is required");
    const store = await Store.isManager(req.body.storeId, req.user._id);
    if(!store) throw new Error("invalid Request");

    const now = moment().tz('Asia/Karachi').toDate();

    let record = {
      storeId: req.body.storeId,
      name: req.body.name,
      openingBalance: 0,
      currentBalance: 0,
      dateCreated: now,
      lastUpdated: now
    }
    const supplier = new Supplier(record);
    await supplier.save();
    res.json( supplier );
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});





module.exports = router;