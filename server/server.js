const express = require('express');
const bodyParser = require('body-parser');
const client = require('./elasticsearch/elasticsearch.js');
const axios = require('axios');
// const consumer = require('sqs-consumer');
// random number generator for ids
const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-1' });

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const queueURL = 'https://sqs.us-west-1.amazonaws.com/486073289734/entry';
// const queueURL = 'https://sqs.us-west-1.amazonaws.com';

const params = {
  AttributeNames: [
    'SentTimestamp',
  ],
  MaxNumberOfMessages: 10,
  MessageAttributeNames: [
    'All',
  ],
  QueueUrl: queueURL,
  VisibilityTimeout: 30,
  WaitTimeSeconds: 0,
};

const tempCacheObject = {};

const handleMessage = function handleMessage(message) {
  console.log('message', message);
  const response = JSON.parse(message.Body);
  console.log('message body data', response.data);
  // find res in our cache, use object for now
  const res = tempCacheObject[response.id];
  res.send('successfully responded');
};

const receive = function receiveFromQueue() {
  return new Promise((resolve, reject) => {
    const deleteBatchParams = {
      Entries: [],
      QueueUrl: queueURL,
    };
    sqs.receiveMessage(params, (err, data) => {
      if (err) {
        console.log('Error: ', err);
        reject(err);
      } else if (data.Messages) {
        data.Messages.forEach((message) => {
          handleMessage(message);
          const deleteParams = {
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          };
          // const finish = new Date();
          // console.log(message);
          // console.log(deleteParams);
          /*
          client.index({
            index: 'logger',
            type: 'latency',
            body: {
              latency: 100,
              '@timestamp': new Date(),
            },
          })
            .then((response) => {
              // console.log('ECREATE', response);
            })
            .catch((err) => {
              console.log(err);
            });
            */
          // const start = new Date();
          // statsd.timing('response_time', new Date() - start);

          deleteBatchParams.Entries.push(deleteParams);
        });

        sqs.deleteMessageBatch(deleteBatchParams, (err, data) => {
          if (err) {
            console.log('Delete Error', err);
          } else {
            // console.log('Message Deleted', data);
          }
        });

        resolve();
      } else {
        resolve();
      }
    });
  });
};

const receiveWrapper = async function receiveWrapper() {
  while (true) {
    await receive();
  }
};

receiveWrapper();

// const msg = { payload: 'a message' };

// const sendParams = {
//   MessageBody: JSON.stringify(msg),
//   DelaySeconds: 0,
//   QueueUrl: queueURL,
// };

// const send = function sendToQueue() {
//   sqs.sendMessage(sendParams, function(err, data) {
//     if (err) console.log(err, err.stack);
//     else console.log(data);
//   });
// };

// send();

// const sqs = consumer.create({
//   queueUrl: 'http://192.168.99.100:9494/search',
//   batchSize: 10,
//   handleMessage: (message, done) => {
//     console.log('GOT', message);
//     done();
//   },
// });

// sqs.on('error', (err) => {
//   console.log(err.message);
// });

// sqs.start();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 7331;

app.get('/search', async (req, res) => {
  // console.log(res);
  // await receive();
  // send a request to search elastic
  const start = new Date();
  client.search({
    index: 'search',
    type: 'doc',
    body: {
      query: {
        fuzzy: {
          title: req.body.title,
        },
      },
    },
  })
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      throw err;
    });
  // insert new query into elasticsearch
  client.search({
    index: 'autocomplete',
    type: 'doc',
    body: {
      query: {
        term: {
          query: req.body.title,
        },
      },
    },
  })
    .then((response) => {
      if (response.hits.hits.length) {
        // exists, so update it
        return client.update({
          index: 'autocomplete',
          type: 'doc',
          id: response.hits.hits[0]._id,
          body: {
            script: 'ctx._source.querycount += 1',
            upsert: {
              querycount: 1,
            },
          },
        });
      } else {
        // doesn't exist, so create it
        return client.index({
          index: 'autocomplete',
          type: 'doc',
          body: {
            query: req.body.title,
            querycount: 1,
            timestamp: new Date(),
          },
        });
      }
    })
    .then((response) => {
      // console.log('ECREATE', response);
    })
    .catch((err) => {
      console.log('DID NOT FIND', err);
    });
  const finish = new Date();
  client.index({
    index: 'testindex',
    type: 'testtype',
    body: {
      title: 'Test 2',
      tags: ['a', 'b'],
      published: true,
      latency: finish - start,
      '@timestamp': new Date(),
      counter: 1,
    },
  })
    .then((response) => {
      // console.log('ECREATE', response);
    })
    .catch((err) => {
      console.log(err);
    });
  // axios.get('http://localhost:8080/logger', { data: { test: 500 } });
  // res.end();
});

app.get('/queries', (req, res) => {
  // send a request to autocomplete elastic
  console.log(req.body);
  /*
  client.search({
    index: 'autocomplete',
    type: 'doc',
    body: {
      query: {
        fuzzy: {
          query: req.body.title,
        },
      },
    },
  })
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      throw err;
    });
    */
});
app.get('/videos', (req, res) => {
  const responseID = uuid();
  const sendQueueURL = 'https://sqs.us-west-1.amazonaws.com/942892812241/videos';
  const msg = {
    // id is for caching res
    // route is /videos
    // resUrl is my queue
    // method is GET to get a video
    id: responseID,
    route: '/videos',
    resUrl: 'https://sqs.us-west-1.amazonaws.com/486073289734/entry',
    method: 'GET',
    // actual video request info
    data: {
      id: req.body.id,
      part: 'snippet,contentDetails,statistics,topicDetails',
    },
  };
  const sendParams = {
    MessageBody: JSON.stringify(msg),
    DelaySeconds: 0,
    QueueUrl: sendQueueURL,
    MessageAttributes: {
      videos: {
        DataType: 'String',
        StringValue: 'videos',
      },
    },
  };
  const send = function sendToQueue() {
    sqs.sendMessage(sendParams, function(err, data) {
      if (err) console.log(err, err.stack);
      else console.log('Queue send response data:', data);
    });
  };
  tempCacheObject[responseID] = res;
  send();
});

app.get('/related', (req, res) => {
  // send a request to related service
  axios.get('relatedUrl/videos')
    .then((response) => {
      res.send(response.data);
    })
    .catch((err) => {
      throw err;
    });
});

app.post('/update', (req, res) => {
  // TODO: bulk update elasticsearch db with new video info
  /*
  const searchBody = [];
  for (var i = 0; i < req.body.newVideos; i += 1) {
    const index = {
      index: { _index: 'search', _id: ._id },
    };
    const searchData = {
      title: snippet.title,
      description: snippet.description,
      tags: snippet.tags,
      views: Math.floor(Math.random() * 100000),
    };
    searchBody.push(index);
    searchBody.push(searchData);
  }
  client.bulk({
    index: 'search',
    type: 'video',
    body: searchBody,
  })
    .then(() => {
      // console.log('ECREATE', response);
    })
    .catch((err) => {
      console.log(err);
    });
    */
});

app.post('/viewed', (req, res) => {
  // send a request to history service
  // should send to history queue
  axios.post('historyUrl/viewed')
    .then((response) => {
      res.send(response.data);
    })
    .catch((err) => {
      throw err;
    });
});

module.exports = app.listen(port, () => console.log(`Listening on port ${port}`));

