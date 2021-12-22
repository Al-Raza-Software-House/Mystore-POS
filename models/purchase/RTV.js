const mongoose = require('mongoose');
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  grnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'grn'
  },
  rtvNumber: Number,
  items: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      parentId: mongoose.Schema.Types.ObjectId, //parent item ID if item is packing
      costPrice: Number,
      adjustment: Number,
      tax: Number,
      quantity: Number,
      batches: [{
        batchNumber: String,
        batchExpiryDate: Date,
        batchQuantity: Number
      }],
      notes: String
    }
  ],

  totalItems: Number,
  totalQuantity: Number,
  totalAmount: Number,
  
  attachment: String,
  notes: String,

  rtvDate: Date,
  creationDate: Date,
  lastUpdated: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('rtv', schema);