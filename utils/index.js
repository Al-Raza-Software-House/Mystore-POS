const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const moment = require('moment-timezone');

const fs = require('fs')
const { resolve } = require('path');
const Item = require( '../models/stock/Item' );

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

//add batches to item, transactionItem=> GRN/RTV/Sale item
const addBatchStock = (item, transactionItem, now, parentItem = null) => {
  return new Promise(async (resolve, reject) => {
    if(!transactionItem || !transactionItem.batches || transactionItem.batches.length === 0) return resolve();
    let itemBatches = parentItem ? parentItem.batches : item.batches;
    if(!itemBatches) itemBatches = [];
    for(let index = 0; index < transactionItem.batches.length; index++)
    {
      let newBatch = transactionItem.batches[index];
      if(!newBatch.batchNumber || !newBatch.batchExpiryDate || newBatch.batchQuantity === 0) continue;
      let batchQuantity = parentItem ? Number(item.packQuantity) * Number(newBatch.batchQuantity) : Number(newBatch.batchQuantity);
      let batchExist = itemBatches.find(record => record.batchNumber.toLowerCase() === newBatch.batchNumber.toLowerCase());
      if(batchExist)
      {
        batchExist.batchStock = +(batchExist.batchStock + batchQuantity).toFixed(2);
        batchExist.batchExpiryDate = moment(newBatch.batchExpiryDate).toDate();
        itemBatches = itemBatches.map( record => record.batchNumber.toLowerCase() === newBatch.batchNumber.toLowerCase() ? batchExist :  record);
      }else
      {
        itemBatches.push({
          batchNumber: newBatch.batchNumber,
          batchExpiryDate: moment(newBatch.batchExpiryDate).toDate(),
          batchStock: +batchQuantity.toFixed(2)
        });
      }
    }
    item.batches = itemBatches;
    await item.save();
    if(parentItem)
    {
      parentItem.batches = itemBatches;
      await parentItem.save();
    }
    // update batches in other packings too;
    await Item.updateMany({ packParentId: parentItem ? parentItem._id : item._id }, { batches: itemBatches, lastUpdated: now });
    resolve();
  });
}

//remove stock from item, transactionItem=> GRN/RTV/Sale item
const removeBatchStock = (item, transactionItem, now, parentItem = null) => {
  return new Promise(async (resolve, reject) => {
    if(!transactionItem || !transactionItem.batches || transactionItem.batches.length === 0) return resolve();
    let itemBatches = parentItem ? parentItem.batches : item.batches;
    if(!itemBatches) itemBatches = [];
    for(let index = 0; index < transactionItem.batches.length; index++)
    {
      let newBatch = transactionItem.batches[index];
      if(!newBatch.batchNumber || newBatch.batchQuantity === 0) continue;
      let batchQuantity = parentItem ? Number(item.packQuantity) * Number(newBatch.batchQuantity) : Number(newBatch.batchQuantity); //convert to units if pack
      let batchExist = itemBatches.find(record => record.batchNumber.toLowerCase() === newBatch.batchNumber.toLowerCase());
      if(batchExist) //remove stock if batches exist
      {
        batchExist.batchStock = +(batchExist.batchStock - batchQuantity).toFixed(2); //minus batch stock 
        if(batchExist.batchStock <= 0) //remove batch if stock goes 0 or -ve
          itemBatches  = itemBatches.filter( record => record.batchNumber.toLowerCase() !== batchExist.batchNumber.toLowerCase() );
        else
          itemBatches = itemBatches.map( record => record.batchNumber.toLowerCase() === batchExist.batchNumber.toLowerCase() ? batchExist :  record);
      }
    }
    item.batches = itemBatches;
    await item.save();
    if(parentItem)
    {
      parentItem.batches = itemBatches;
      await parentItem.save();
    }
    // update batches in other packings too;
    await Item.updateMany({ packParentId: parentItem ? parentItem._id : item._id }, { batches: itemBatches, lastUpdated: now });
    resolve();
  });
}



module.exports = {
  createJwtToken, 
  getS3ImageUrl, 
  createAuthUser,
  deleteS3Object,
  publicS3Object,

  addBatchStock,
  removeBatchStock
};