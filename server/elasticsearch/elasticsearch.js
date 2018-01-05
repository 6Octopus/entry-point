const elasticsearch = require('elasticsearch');



// const client = new elasticsearch.Client({
//   host: [
//     {
//       host: '849e4ed9064d39e531c3a9e4f6edcab2.us-west-1.aws.found.io',
//       auth: 'elastic:kNqVIP1AhibXCLMnwGHz3PaU',
//       port: 9243,
//       protocol: 'https',
//     },
//   ],
//   // log: 'info',
// });

const client = new elasticsearch.Client({
  host: '13.57.248.225:9200',
  // log: 'info',
});


module.exports.client = client;
// module.exports.testClient = testClient;
