const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
  },
  name: String,
  type: Number, //standard or variant(size or color)
  notes: String,
  picture: String,
  itemCodePrefix: String,
  itemCodeCursor: Number,
  sizes: [{ code: String, title: String}],
  combinations: [{ code: String, title: String}],
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
})

module.exports = mongoose.model('category', categorySchema);