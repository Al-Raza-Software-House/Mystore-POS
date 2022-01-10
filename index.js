process.env.NODE_ENV !== 'production' && require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');

//init AWS SDK
const AWS = require('aws-sdk');
const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com');
AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey:process.env.AWS_SECRET,
  endpoint: spacesEndpoint
});

mongoose.connect(process.env.MONGODB_URI, {
  autoIndex: false,
})
.then( () => {
  console.log("database connected");
} 
).catch((err) => console.log(err.message));


const app = express();
app.use(compression())
app.use(cors());
app.use(bodyParser.json());

//app.use((req, res, next) => setTimeout(next, 1000));
app.use(express.static( path.join(__dirname, '/client/build') ));
//Dasboard
app.use('/api/dashboard', require('./routes/dashboard'));
//stock module
app.use('/api/items', require('./routes/items'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/itemProperties', require('./routes/itemProperties'));
app.use('/api/adjustmentReasons', require('./routes/adjustmentReasons'));
//Sals Module
app.use('/api/sales', require('./routes/sales'));
app.use('/api/closings', require('./routes/closings'));
//Purchase module
app.use('/api/purchaseOrders', require('./routes/purchaseOrders'));
app.use('/api/grns', require('./routes/grns'));
app.use('/api/rtvs', require('./routes/rtvs'));
//Parties Module
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/customers', require('./routes/customers'));
//Accounts module
app.use('/api/accounts', require('./routes/accounts'));

//Billing, settings, stores, help
app.use('/api/billing', require('./routes/billing'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/help', require('./routes/help'));
//login, signup, profile settings
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));


app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '/client/build/index.html')
  )
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening at ${PORT}`));