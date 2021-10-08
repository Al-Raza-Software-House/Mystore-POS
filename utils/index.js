const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const moment = require('moment-timezone');

const fs = require('fs')
const request = require('request');
const { resolve } = require('path');

const createJwtToken = (user, expire_in_hours = 5 * 365 * 24) => {
  const payload = {
    uid: user._id,
    iat: moment().unix(),
    exp: moment().add(expire_in_hours*60, 'minutes').unix(),
    claims: {
      phone: user.phone
    }
  }
  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_SIGN_KEY, (err, token) => {
      if(err) reject(err);
      resolve(token);
    });
  })
}

const getS3ImageUrl =  async (filePath, s3Instance=null) => {
  const s3 = s3Instance ? s3Instance : new AWS.S3();
  const url = await s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.AWS_IMAGES_BUCKET, 
    Key: filePath,
    Expires: process.env.AWS_SIGNED_URL_EXPIRY_HOURS * 60 * 60 // N hours * 60 mins * 60 seconds
  });
  return url;
}



const createAuthUser = user => {
  if(user.password)
    user.hasPassword = true;
  const deleteFields = ['password', '_v', 'verificationPin'];
  deleteFields.forEach(key => delete user[key]);
  return user;
}

const deleteS3Object = async (key) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.AWS_IMAGES_BUCKET,
    Key: key
  };
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if(err) reject(err);
      resolve(data);
    });
  });
}

const publicS3Object = async (key) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.AWS_IMAGES_BUCKET,
    Key: key,
    ACL: 'public-read'
  };
  return new Promise((resolve, reject) => {
    s3.putObjectAcl(params, (err, data) => {
      if(err) reject(err);
      resolve(data);
    });
  });
}

const downloadImage = (url, path) => {
  return new Promise((resolve, reject) => {
    request.head(url, (err, res, body) => {
      if(err) reject(err);
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', () => resolve(path))
    })
  });
}

module.exports = { 
  createJwtToken, 
  getS3ImageUrl, 
  createAuthUser,
  deleteS3Object,
  downloadImage,
  publicS3Object
};