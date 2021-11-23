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
  parentId: mongoose.Schema.Types.ObjectId, //sale ID, GRN ID, supplier Payment ID, customer Receipt ID
  headId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accountHead'
  },
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bank'
  },
  amount: Number,
  type: Number, //cash transaction affecting cash in store, or Bank transaction that has no effect on cash in store
  notes: String,
  description: String,
  time: Date,
  lastUpdated: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('accountTransaction', schema);