const mongoose = require('mongoose');
const moment = require("moment-timezone");

const stockTransactionsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  itemId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item'
  },
  packId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item',
    default: null
  },
  saleId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sales'
  },
  grnId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'grn'
  },
  returnId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vendorReturn'
  },
  reasonId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adjustmentReason'
  },
  quantity: Number,
  notes: String,
  time: Date,
})

module.exports = mongoose.model('stockTransaction', stockTransactionsSchema);