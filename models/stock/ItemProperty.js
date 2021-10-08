const mongoose = require('mongoose');

const itemPropertySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store'
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
})

module.exports = mongoose.model('itemProperty', itemPropertySchema);