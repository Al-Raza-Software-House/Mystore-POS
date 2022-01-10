const mongoose = require('mongoose');
const moment = require("moment-timezone");

const itemPropertySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    index: true
  },
  property1:{
    name: String,
    values: [{ title: String, notes: String }]
  },
  property2:{
    name: String,
    values: [{ title: String, notes: String }]
  },
  property3:{
    name: String,
    values: [{ title: String, notes: String }]
  },
  property4:{
    name: String,
    values: [{ title: String, notes: String }]
  },
  creationDate: Date,
  lastUpdated: Date,
})

//store record/settings udpate
itemPropertySchema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('itemProperty', itemPropertySchema);