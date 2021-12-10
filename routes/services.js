const router = require('express').Router();
const Store = require('../models/store/Store');
const { authCheck } = require('../utils/middlewares');
const AWS = require('aws-sdk');

router.use(authCheck);

router.post('/createPhotoUploadUrl', async (req, res) => {
  try
  {
    if(!req.body.filePath) throw new Error("file path is required");
    if(req.body.storeId)
    {
      if(!(await Store.isManager(req.body.storeId, req.user._id) ))
      throw new Error("Invalid Request");
    }

    let key = process.env.AWS_KEY_PREFIX;
    if(req.body.storeId)
      key += req.body.storeId + '/';
    key += req.body.filePath;
    key += req.body.file;
    let params = {
      Bucket: process.env.AWS_IMAGES_BUCKET, 
      Key: key,
      ContentType: req.body.type
    };
    const s3 = new AWS.S3();
    let response = {
      fileName: req.body.file,
      putUrl: await s3.getSignedUrlPromise('putObject', params),
    };
    res.json(response);
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});







module.exports = router;
