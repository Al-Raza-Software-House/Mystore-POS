const router = require('express').Router();
const Video = require('../models/system/Video');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const Store = require( '../models/store/Store' );
const DeleteActivity = require('../models/store/DeleteActivity');
const bcrypt = require( 'bcryptjs/dist/bcrypt' );
//router.use(authCheck);

//get user's stores list
router.get('/videos', async (req, res) => {
  try
  {
    const videos = await Video.find({});
    res.json(videos);
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/videos/new', async (req, res) => {
  try
  {
    if(!req.body.password) throw new Error("Password is required");
    if(!(await bcrypt.compare(req.body.password, process.env.SUPER_KEY)) )
      throw new Error("request invalid");

    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      moduleName: req.body.moduleName ? req.body.moduleName : "",
      screens: req.body.screens ? req.body.screens : "",
      order: req.body.order ? req.body.order : "",
      thumbnail: req.body.thumbnail ? req.body.thumbnail : "",
      duration: req.body.duration ? req.body.duration : "",
      youtubeId: req.body.youtubeId ? req.body.youtubeId : "",
      creationDate: now,
      lastUpdated: now
    }
    await new Video(record).save();
    await Store.updateMany({}, {'dataUpdated.videos' : now });
    res.json({ success: true });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/videos/edit', async (req, res) => {
  try
  {
    if(!req.body.password) throw new Error("Password is required");
    if(!req.body.videoId) throw new Error("videoId is required");
    if(!(await bcrypt.compare(req.body.password, process.env.SUPER_KEY)) )
      throw new Error("request invalid");

    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      moduleName: req.body.moduleName ? req.body.moduleName : "",
      screens: req.body.screens ? req.body.screens : "",
      order: req.body.order ? req.body.order : "",
      thumbnail: req.body.thumbnail ? req.body.thumbnail : "",
      duration: req.body.duration ? req.body.duration : "",
      youtubeId: req.body.youtubeId ? req.body.youtubeId : "",
      creationDate: now,
      lastUpdated: now
    }
    await Video.findByIdAndUpdate(req.body.videoId, record );
    await Store.updateMany({}, {'dataUpdated.videos' : now });
    res.json({ success: true });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});




module.exports = router;
