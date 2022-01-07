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
  startTime: Date,
  endTime: Date,

  status: Number, //open or closed

  openingCash: Number,
  totalInflow: Number,
  totalOutflow: Number,
  expectedCash: Number,
  cashCounted: Number,
  cashDifference: Number,
  notes: String,

  inflows:{
    cashSales: Number,
    customerCreditPayments: Number,
    income: Number,
    cashFromBank: Number,
    other: Number, //all other heads where type is income or (general and cash received)
  },

  outflows: {
    cashPurchases: Number,
    supplierPayments: Number,
    expenses: Number,
    cashToBank: Number,
    other: Number, //all other heads where type is expense or (general and cash paid)
  }
  
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('closing', schema);