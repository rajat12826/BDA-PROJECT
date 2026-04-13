const hbase = require('hbase');

const client = hbase({
  host: process.env.HBASE_HOST || 'localhost',
  port: process.env.HBASE_PORT || 8080
});

module.exports = client;
