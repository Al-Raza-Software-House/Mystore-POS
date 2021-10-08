const mongoose = require('mongoose');
const moment = require("moment-timezone");
const { userRoles } = require('../../utils/constants');

const storeUsersSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId
  },
  userRole: Number,
  isCreator: {
    type: Boolean,
    default: false
  }
});

const registorSchema = new mongoose.Schema({
  code: String,
  name: String,
  notes: String
});

const receiptSettingsSchema = new mongoose.Schema({
  header: String,
  logo: String,  
  footer: String,
  marginTop: Number,
  marginLeft: Number,

  printItemName: Boolean,
  printItemCode: Boolean,
  printSaleId: Boolean,
  printSaleComments: Boolean,
  printCustomerLedger: Boolean,
  printGST: Boolean,

  showPrintPreview: Boolean,
  printSalesReceipt: Boolean

});

const storeConfiguration = new mongoose.Schema({
  allowNegativeInventory: Boolean
});

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Store name is required"]
  },
  phone1: String,
  phone2: String,
  city: String,
  address: String,
  businessType: Number, 
  status: Number,

  openingDate: Date,
  lastVisited: Date,
  lastActivity: Date,
  lastPayment: Date,
  expiryDate: Date,
  monthlyPricing: Number,
  discountCode: String,
  currency: String,
  createdOn: Date,
  
  users: [storeUsersSchema],
  registors: [registorSchema],
  receiptSettings: receiptSettingsSchema,
  configuration: storeConfiguration
});

storeSchema.virtual('users.record',{
    ref: 'user',
    localField: 'users.userId',
    foreignField: '_id',
    justOne: true
});

storeSchema.set('toObject', { virtuals: true });
storeSchema.set('toJSON', { virtuals: true });

storeSchema.statics.isOwner = function(storeId, userId) {
  return this.findOne({_id: storeId, 'users.userId': userId, 'users.userRole': userRoles.USER_ROLE_OWNER});
};

storeSchema.statics.isManager = function(storeId, userId) {
  return this.findOne({_id: storeId, 'users.userId': userId, 'users.userRole': { $in: [userRoles.USER_ROLE_OWNER, userRoles.USER_ROLE_MANAGER] } });
};

storeSchema.statics.isStoreUser = function(storeId, userId) {
  return this.findOne({_id: storeId, 'users.userId': userId});
};

storeSchema.methods.updateLastVisited = function(){
  this.lastVisited = moment().tz('Asia/Karachi').toDate();
  return this.save();
}

storeSchema.methods.updateLastActivity = function(){
  this.lastActivity = moment().tz('Asia/Karachi').toDate();
  return this.save();
}

module.exports = mongoose.model('store', storeSchema);