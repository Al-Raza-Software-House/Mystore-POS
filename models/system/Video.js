const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: String,
  moduleName: String,
  screens: [String],
  order: Number,
  thumbnail: String,
  duration: String,
  youtubeId: String,
  
  creationDate: Date,
  lastUpdated: Date,
});

module.exports = mongoose.model('video', videoSchema);