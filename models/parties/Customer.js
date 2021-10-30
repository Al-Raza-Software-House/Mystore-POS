const mongoose = require('mongoose');
const moment = require("moment-timezone");

const customerSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  name: String,
  phone1: String,
  phone2: String,
  city: String,
  address: String,
  openingBalance: Number,
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