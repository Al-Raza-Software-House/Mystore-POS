const mongoose = require('mongoose');
const moment = require("moment-timezone");

const adjustmentReasonSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  name:{
    type: String,
    required: [true, "Name is required"]
  },
  notes: String,//Version 2
  default: Boolean,
  
  creationDate: Date,
  lastUpdated: Date,
})

//store record/settings udpate
adjustmentReasonSchema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('adjustmentReason', adjustmentReasonSchema);