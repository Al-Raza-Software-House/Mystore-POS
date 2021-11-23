const mongoose = require('mongoose');
const moment = require("moment-timezone");

const customerSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  name: String,
  mobile: String,
  allowCredit: Boolean,
  creditLimit: Number,

  city: String,
  address: String,
  notes: String,

  openingBalance: Number,
  totalSales: Number,
  totalReturns: Number,
  totalPayment: Number,
  currentBalance: Number,

  creationDate: Date,
  lastUpdated: Date,
  lastPayment: Date,
  lastSale: Date,
})

//store record/settings udpate
customerSchema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('customer', customerSchema);