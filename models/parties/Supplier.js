const mongoose = require('mongoose');
const moment = require("moment-timezone");

const supplierSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    index: true
  },
  contactPersonName: String,
  name: String,
  mobile: String,
  phone1: String,
  phone2: String,
  city: String,
  address: String,

  openingBalance: Number,
  totalPurchases: Number,
  totalReturns: Number,
  totalPayment: Number,
  currentBalance: Number,
  
  creationDate: Date,
  lastUpdated: Date,
  lastPayment: Date,
  lastPurchase: Date,
})

//store record/settings udpate
supplierSchema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('supplier', supplierSchema);