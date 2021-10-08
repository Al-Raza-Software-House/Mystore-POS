const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  name: String,
  phone1: String,
  phone2: String,
  phone3: String,
  contactPersonName: String,
  city: String,
  address: String,
  openingBalance: Number,
  currentBalance: Number,
  dateCreated: Date,
  lastUpdated: Date,
  lastPayment: Date,
  lastPurchase: Date,
})

module.exports = mongoose.model('supplier', supplierSchema);