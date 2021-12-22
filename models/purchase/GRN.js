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
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  poId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchaseOrder'
  },
  grnNumber: Number,
  payOrCredit: Number, //cash or credit
  bankId: mongoose.Schema.Types.ObjectId,
  chequeTxnId: String,
  
  items: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      parentId: mongoose.Schema.Types.ObjectId, //parent item ID if item is packing
      prevCostPrice: Number,
      prevSalePrice: Number,
      prevPackSalePrice: Number,
      costPrice: Number,
      salePrice: Number,
      packSalePrice: Number,
      adjustment: Number,
      tax: Number,
      quantity: Number,
      batches: [{
        batchNumber: String,
        batchExpiryDate: Date,
        batchQuantity: Number
      }],
      notes: String
    }
  ],

  totalItems: Number,
  totalQuantity: Number,
  totalAmount: Number,
  totalExpenses: Number,
  totalTax: Number,

  //Bill details
  supplierInvoiceNumber: String,
  billNumber:String,
  billDate: Date,
  billDueDate: Date,

  //other Expenses
  loadingExpense: Number,
  freightExpense: Number,
  otherExpense: Number,
  adjustmentAmount: Number,
  purchaseTax: Number,
  
  attachment: String,
  notes: String,

  grnDate: Date,
  creationDate: Date,
  lastUpdated: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('grn', schema);