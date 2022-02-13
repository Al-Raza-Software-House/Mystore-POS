const mongoose = require('mongoose');
const moment = require("moment-timezone");

const itemSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  itemCode: String,
  itemName: String,
  costPrice: Number,
  salePrice: Number,
  description: String,
  image: String,
  isServiceItem: Boolean, //quantity doesn't matter
  isFavorite: Boolean, //quantity doesn't matter
  isActive: Boolean, //if not selling it anymore make inactive
  minStock: Number,
  maxStock: Number,
  currentStock: Number,
  batches: [{
    batchNumber: String,
    batchExpiryDate: Date,
    batchStock: Number
  }],
  sizeId: mongoose.Schema.Types.ObjectId,
  sizeCode: String,
  sizeName: String,
  combinationId: mongoose.Schema.Types.ObjectId,
  combinationCode: String,
  combinationName: String,
  varientParentId: mongoose.Schema.Types.ObjectId, //group of variants
  packParentId: mongoose.Schema.Types.ObjectId, // id of parent item if it is a packed item
  packQuantity: Number,
  packSalePrice: Number,
  categoryPropertyValues: {
    property1: mongoose.Schema.Types.ObjectId,
    property2: mongoose.Schema.Types.ObjectId,
    property3: mongoose.Schema.Types.ObjectId,
    property4: mongoose.Schema.Types.ObjectId,
  },
  itemPropertyValues: {
    property1: mongoose.Schema.Types.ObjectId,
    property2: mongoose.Schema.Types.ObjectId,
    property3: mongoose.Schema.Types.ObjectId,
    property4: mongoose.Schema.Types.ObjectId,
  },
  expiryDate: Date,
  creationDate: Date,
  lastUpdated: Date,
})

//store record/settings udpate
itemSchema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('item', itemSchema);