const mongoose = require('mongoose');
const moment = require("moment-timezone");

const videoSchema = new mongoose.Schema({
  moduleName: String,
  screenId: String,
  order: Number,
  thumbnail: String,
  duration: String,
  youtubeId: String,
  
  creationDate: Date,
  lastUpdated: Date,
});

module.exports = mongoose.model('video', videoSchema);