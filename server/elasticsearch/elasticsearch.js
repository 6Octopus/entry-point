const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client({
  host: '192.168.99.100:9200',
  log: 'info',
});

module.exports = client;
