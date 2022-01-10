const jwt = require('jsonwebtoken');
const User = require('../models/system/User');
const { createAuthUser } = require('../utils');

const authCheck = async (req, res, done) => {
  try
  {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if(!token)
      throw new Error("");
    if (token.startsWith('Bearer '))
      token = token.slice(7, token.length);
    if(!token)
      throw new Error("");
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SIGN_KEY, (err, decoded) => { if(err) reject(new Error("Invalid Request")); resolve(decoded) });
    });
    let user = await User.findById(decoded.uid);
    if(!user)
      throw new Error("User not found");
    await user.updateLastVisited();
    user = user.toObject();
    if(user.status <= 0)
      throw new Error("Account is disabled");
    req.user = createAuthUser( user );
    done();
  }catch(err)
  {
    res.status(401).json({message: err.message}).end();
  }
}

module.exports = { 
  authCheck
};