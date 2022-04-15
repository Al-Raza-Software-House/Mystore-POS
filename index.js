const throng = require('throng');
const startWorker = require( './worker' );

const WORKERS = process.env.WEB_CONCURRENCY || 1;

throng({
  worker: startWorker,
  count: WORKERS,
  lifetime: Infinity,   
});