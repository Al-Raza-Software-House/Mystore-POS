process.env.NODE_ENV !== 'production' && require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

//init AWS SDK
const AWS = require('aws-sdk');
const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com');
AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey:process.env.AWS_SECRET,
  endpoint: spacesEndpoint
});


//const s3 = new AWS.S3();
// const thisConfig = {
//     AllowedMethods: ['GET', 'POST', 'PUT', 'HEAD'],
//     AllowedOrigins: ['*'],
//     ExposeHeaders: [],
//     AllowedHeaders: ['*'],
//     MaxAgeSeconds: 3000,
//   };
// const corsRules = new Array(thisConfig);
//   const corsParams = {
//     Bucket: process.env.AWS_IMAGES_BUCKET,
//    CORSConfiguration: { CORSRules: corsRules },
//   };
// s3.putBucketCors(corsParams, function(err, data){
//   //console.log(data.CORSRules[0]);
// })
const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false  
}

mongoose.connect(process.env.MONGODB_URI, mongooseConfig)
.then( () => {
  console.log("database connected");
} 
).catch((err) => console.log(err.message));


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => setTimeout(next, 400));
app.use(express.static( path.join(__dirname, '/client/build') ));
app.use('/fonts', express.static( path.join(__dirname, '/assets/fonts') ));
app.use('/images', express.static( path.join(__dirname, '/images') ));

// app.use('/api/admin/topics', require('./routes/admin/topics'));
// app.use('/api/admin/posts', require('./routes/admin/posts'));

// app.use('/api/posts', require('./routes/posts'));
// app.use('/api/topics', require('./routes/topics'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/items', require('./routes/items'));
app.use('/api/services', require('./routes/services'));

app.use('/api/itemProperties', require('./routes/itemProperties'));
app.use('/api/adjustmentReasons', require('./routes/adjustmentReasons'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/help', require('./routes/help'));
app.use('/api/users', require('./routes/users'));

//app.set('view engine', 'ejs');
const ejs = require('ejs');

app.get('/test', (req, res) => {
  ejs.renderFile('./views/emails/resetPassword.ejs', {code: 132843, name: "Ali"}, (err, str) => {
    res.send(str);
  });
  //res.render('emails/resetPassword', );
});

app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '/client/build/index.html')
  )
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening at ${PORT}`));