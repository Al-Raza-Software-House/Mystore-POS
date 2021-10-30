const mongoose = require('mongoose');
const moment = require("moment-timezone");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  phone: {
    type: String,
    required: [true, "Mobile number is required"]
  },
  email:{
    type: String,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: "Invalid Email address"
    }
  },
  password: {
    type: String
  },
  verificationPin: String,
  isNumberVerified: Number,
  profilePicture: String,
  status: Number,
  language: String,
  
  creationDate: Date,
  lastVisited: Date,
  lastUpdated: Date,
});

userSchema.methods.updateLastVisited = function(){
  this.lastVisited = moment().tz('Asia/Karachi').toDate();
  return this.save();
}

module.exports = mongoose.model('user', userSchema);