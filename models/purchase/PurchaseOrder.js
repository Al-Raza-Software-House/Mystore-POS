const mongoose = require('mongoose');
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  poNumber: Number,
  referenceNumber: String,
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
  totalItems: Number,
  totalQuantity: Number,
  totalAmount: Number,
  
  status: Number, //open,closed, 
  notes: String,
  items: [
    {
      itemId: mongoose.Schema.Types.ObjectId,
      costPrice: Number,
      quantity: Number,
    }
  ],

  issueDate : Date,
  deliveryDate: Date,
  creationDate: Date,
  lastUpdated: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('purchaseOrder', schema);