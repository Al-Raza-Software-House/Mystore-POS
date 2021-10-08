const mongoose = require('mongoose');

const BillingTransactionSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store' 
  },
  transactionId: String,
  monthsPaid: Number,
  amount: Number,
  monthlyPricing: Number,
  time: Date,
  method: {
    type: String,
    default: 'Mobile Account'
  },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  userName: String,
  userPhone: String,
  mobileAccountNumber: String,
  prevExpiryDate: Date,
  nextExpiryDate: Date,
  transactionStatus: String
});

module.exports = mongoose.model('billingTransaction', BillingTransactionSchema);