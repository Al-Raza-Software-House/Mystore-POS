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
    ref: 'customer'
  },
  registorId: mongoose.Schema.Types.ObjectId,
  saleNumber: Number,
  isVoided: Boolean,

  totalItems: Number,
  totalQuantity: Number,
  totalDiscount: Number,
  totalCost: Number,
  totalAmount: Number,
  
  adjustment: Number,
  profit: Number,

  cashPaid: Number, //Total Cash paid by customer
  bankAmount: Number, //amount paid via bank. can be full or partial
  creditAmount: Number, //Amount to put in customer ledger
  cashAmount: Number, // actual cash charged to customer
  balanceAmount: Number, //cash returned to customer

  bankId: mongoose.Schema.Types.ObjectId,
  chequeTxnId: String,

  notes: String,

  saleDate: Date,
  creationDate: Date,
  lastUpdated: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('sale', schema);