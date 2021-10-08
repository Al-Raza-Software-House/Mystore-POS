const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  moduleName: String,
  screenId: String,
  order: Number,
  thumbnail: String,
  duration: String,
  youtubeId: String
});

module.exports = mongoose.model('video', videoSchema);