const mongoose = require('mongoose');

const stockTransactionsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  itemId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item'
  },
  categoryId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
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
  rtvId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rtv'
  },
  reasonId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'adjustmentReason'
  },
  quantity: Number,
  batches: [{
    batchNumber: String,
    batchExpiryDate: Date,
    batchQuantity: Number
  }],
  notes: String,
  time: Date,
})

module.exports = mongoose.model('stockTransaction', stockTransactionsSchema);