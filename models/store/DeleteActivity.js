const mongoose = require('mongoose');
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    index: true
  },
  recordId: mongoose.Schema.Types.ObjectId, // record id which is deleted
  collectionName: String, // collection from where record is deleted
  time: Date, //time when deleted
});

module.exports = mongoose.model('deleteActivity', schema);