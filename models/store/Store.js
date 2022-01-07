const mongoose = require('mongoose');
const moment = require("moment-timezone");
const { userRoles, storeStates } = require('../../utils/constants');

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
  logo: String,  
  printSalesReceipt: Boolean,
  printSaleId: Boolean,
  printSalesperson: Boolean,
  printCustomerName: Boolean,
  printSaleNotes: Boolean,

  printItemName: Boolean,
  printItemCode: Boolean,
  printCustomerLedger: Boolean,

  receiptTitle: String,
  footer: String,

});

const storeConfiguration = new mongoose.Schema({
  allowNegativeInventory: Boolean,
  weightedCostPrice:Boolean
});

const dataUpdatedSchema = new mongoose.Schema({
  stores: Date,
  videos: Date,
  itemProperties: Date,
  categories: Date,
  items: Date,
  adjustmentReasons: Date,
  suppliers: Date,
  customers: Date,
  banks: Date,
  accountHeads: Date,
  deleteActivity: Date
})

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

  monthlyPricing: Number,
  discountCode: String,
  currency: String,
  
  creationDate: Date,
  openingDate: Date, //when store physically established

  lastVisited: Date, //when last visited by user
  lastActivity: Date, // any record add/updated/deleted
  lastUpdated: Date, //when store record updatd, except from time stamps

  lastPayment: Date, //when was last transaction
  expiryDate: Date, //when subscription expires
  lastEndOfDay: Date, //Last day closed at
  
  users: [storeUsersSchema],
  registors: [registorSchema],
  receiptSettings: receiptSettingsSchema,
  configuration: storeConfiguration,
  dataUpdated: dataUpdatedSchema,
  accountHeadIds: {
    Sales: mongoose.Schema.Types.ObjectId,
    Purchase: mongoose.Schema.Types.ObjectId,
    CustomerReceipt: mongoose.Schema.Types.ObjectId,
    SupplierPayment: mongoose.Schema.Types.ObjectId,
    BankAccount: mongoose.Schema.Types.ObjectId,
  },
  idsCursors:{
    poCursor: Number,
    grnCursor: Number,
    rtvCursor: Number,
    saleCursor: Number
  }
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
  return this.findOne({_id: storeId, status: storeStates.STORE_STATUS_ACTIVE, 'users.userId': userId, 'users.userRole': userRoles.USER_ROLE_OWNER});
};

storeSchema.statics.isManager = function(storeId, userId) {
  return this.findOne({_id: storeId, status: storeStates.STORE_STATUS_ACTIVE, 'users.userId': userId, 'users.userRole': { $in: [userRoles.USER_ROLE_OWNER, userRoles.USER_ROLE_MANAGER] } });
};

storeSchema.statics.isStoreUser = function(storeId, userId) {
  return this.findOne({_id: storeId, status: storeStates.STORE_STATUS_ACTIVE, 'users.userId': userId});
};

//any entity data fetched from server
storeSchema.methods.updateLastVisited = function(){
  this.lastVisited = moment().tz('Asia/Karachi').toDate();
  return this.save();
}

//any activity performed on items, categories or other store entities
storeSchema.methods.updateLastActivity = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastActivity = now;
  this.lastVisited = now;
  return this.save();
}

//store record/settings udpate
storeSchema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  this.lastActivity = now;
  this.lastVisited = now;
  return this.save();
}

//store record/settings udpate
storeSchema.methods.logCollectionLastUpdated = function(collection, time=null){
  const now = time ? time : moment().tz('Asia/Karachi').toDate();
  this.dataUpdated[collection] = now;
  return this.save();
}

module.exports = mongoose.model('store', storeSchema);