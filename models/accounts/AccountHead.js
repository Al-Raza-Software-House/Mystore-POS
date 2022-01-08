const mongoose = require('mongoose');
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
  },
  name: String,
  editAble: Boolean, //cannot be edit/deleted
  systemHead: Boolean, //only system will do transaction against this head
  type: Number,
  notes: String,
  creationDate: Date,
  lastUpdated: Date,
  lastTransaction: Date,
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}


module.exports = mongoose.model('accountHead', schema);