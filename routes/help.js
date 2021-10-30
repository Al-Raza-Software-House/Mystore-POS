const router = require('express').Router();
const Video = require('../models/system/Video');
const { authCheck } = require('../utils/middlewares');
const moment = require("moment-timezone");
const Store = require( '../models/store/Store' );

router.use(authCheck);

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

router.get('/videos/new', async (req, res) => {
  try
  {
    const now = moment().tz('Asia/Karachi').toDate();
    let record = {
      moduleName: 'general',
      screenId: '/dashboard',
      order: 1,
      thumbnail: 'https://picsum.photos/296/166',
      duration: '02:34',
      youtubeUrl: '9kdUS_ulck4',
      creationDate: now,
      lastUpdated: now
    }
    await new Video(record).save();
    await Store.updateMany({}, {'dataUpdated.videos' : now });
    //await Video.updateMany({}, { youtubeId: 'OHuNnQ_pcRU' });
    res.json({ success: true });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});




module.exports = router;
