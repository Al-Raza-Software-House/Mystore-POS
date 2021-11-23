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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bank'
  },
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bank'
  },
  amount: Number,
  type: Number, //Purchase, return, 
  description: String,
  notes: String,
  time: Date,
  lastUpdated: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('customerLedger', schema);