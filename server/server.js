const express = require('express');
const bodyParser = require('body-parser');
const client = require('./elasticsearch/elasticsearch.js').client;
// const testClient = require('./elasticsearch/elasticsearch.js').testClient;
const uuid = require('uuid/v4');
// const SQS = require('./SQS.js');
const winston = require('winston');
const Elasticsearch = require('winston-elasticsearch');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-1' });

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const receiveFromQueue = function receive(receiveQueueURL, callback) {
  return new Promise((resolve, reject) => {
    const params = {
      AttributeNames: [
        'SentTimestamp',
      ],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: [
        'All',
      ],
      QueueUrl: receiveQueueURL,
      VisibilityTimeout: 30,
      WaitTimeSeconds: 20,
    };
    const deleteBatchParams = {
      Entries: [],
      QueueUrl: receiveQueueURL,
    };
    sqs.receiveMessage(params, (err, data) => {
      if (err) {
        console.log('Error: ', err);
        reject(err);
      } else if (data.Messages) {
        data.Messages.forEach((message) => {
          callback(message);
          const deleteParams = {
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          };
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
        // console.log('next');
        resolve();
      }
    });
  });
};
const esTransportOpts = {
  level: 'info',
  client,
};

const logger = new winston.Logger({
  transports: [
    new Elasticsearch(esTransportOpts),
  ],
});



const handleMessage = function handleMessage(message) {
  const start = Date.now();
  const response = JSON.parse(message.Body);
  // console.log(response);
  if (response.route === '/update') {
    if (response.method === 'POST') {
      // update database
      console.log(message.Body);
    }
  } else {
    const res = response.res;
    response.res && response.res.send(response.data);
  }
  const finish = Date.now();
  logger.info('handleMessage', { latency: finish - start });
};

const receiveQueueURL = process.env.ENTRY_QUEUE_URL;

const receiveWrapper = async function receiveWrapper() {
  while (true) {
    await receiveFromQueue(receiveQueueURL, handleMessage);
  }
};

// start a group of receivers from the queue
// for (let i = 0; i < 100; i += 1) {
//   receiveWrapper();
// }

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 7331;

app.get('/search', (req, res) => {
  // console.log(res);
  // await receive();
  // console.log(req.query.title);
  // send a request to search elastic
  const start = new Date();
  client.search({
    index: 'search',
    type: 'video',
    body: {
      query: {
        fuzzy: {
          title: req.query.title,
        },
      },
    },
  })
    .then((response) => {
      logger.info('search', { latency:  new Date() - start });
      res.send(response);
    })
    .catch((err) => {
      console.log(err);
    });
  // console.log(req.query.title);
  // insert new query into elasticsearch
  const updateQuery = function updateQuery() {
    client.update({
      index: 'autocomplete',
      type: 'video',
      id: req.query.title,
      body: {
        script: 'ctx._source.querycount += 1',
        upsert: {
          querycount: 1,
        },
      },
    })
      .then((response) => {
        console.log('ECREATE', response);
      })
      .catch((err) => {
        // updateQuery();
        console.log('Error in autocomplete add:', err);
      });
  };
  updateQuery();
});

app.get('/queries', (req, res) => {
  // send a request to autocomplete elastic
  const start = new Date();
  // console.log(req.query);
  client.search({
    index: 'autocomplete',
    type: 'video',
    body: {
      query: {
        fuzzy: {
          query: req.query.title,
        },
      },
    },
  })
    .then((response) => {
      res.send(response);
      logger.info('queries', { latency: new Date() - start });
    })
    .catch((err) => {
      throw err;
    });
});
app.get('/videos', (req, res) => {
  const sendQueueURL = process.env.VIDEO_QUEUE_URL;
  console.log('videos endpoint');
  const msg = {
    // id is for caching res
    // route is /videos
    // resUrl is my queue
    // method is GET to get a video
    res,
    route: '/videos',
    resUrl: process.env.ENTRY_QUEUE_URL,
    method: 'GET',
    // actual video request info
    data: {
      id: req.query.id,
      part: req.query.part,
    },
  };
  console.log('before send queue');
  const sendParams = {
    MessageBody: JSON.stringify(msg),
    DelaySeconds: 0,
    QueueUrl: sendQueueURL,
  };
  console.log('before send message');
  sqs.sendMessage(sendParams, (err, data) => {
    if (err) console.log('Error in send to queue:', err, err.stack);
    else console.log('Queue send response data:', data);
  });
  console.log('sent to queue');
});

/*
app.get('/related', (req, res) => {
  // send a request to related service
  const responseID = uuid();
  const sendQueueURL = process.env.RELATED_QUEUE_URL;
  const msg = {
    // used by the client to retrieve response object from cache
    id: responseID,
    route: '/related',
    resUrl: process.env.ENTRY_QUEUE_URL,
    method: 'GET',
    data: {
      id: req.query.id,
    },
  };
  tempCacheObject[responseID] = res;
  SQS.sendToQueue(sendQueueURL, msg);
});
*/

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
  const sendQueueURL = process.env.HISTORY_QUEUE_URL;
  console.log('videos endpoint');
  const msg = {
    // id is for caching res
    // route is /videos
    // resUrl is my queue
    // method is GET to get a video
    // actual video request info
    data: [req.body],
  };
  console.log('before send queue');
  const sendParams = {
    MessageBody: JSON.stringify([req.body]),
    DelaySeconds: 0,
    QueueUrl: sendQueueURL,
  };
  console.log('before send message');
  sqs.sendMessage(sendParams, (err, data) => {
    if (err) console.log('Error in send to queue:', err, err.stack);
    else console.log('Queue send response data:', data);
  });
  console.log('sent to queue');
  res.send('sent to history service');
});

app.get('/test', (req, res) => {
  const start = new Date();
  // client.get({
  //   index: 'autocomplete',
  //   type: 'video',
  //   id: 'Canyon Health Small',
  // })
  //   .then(() => {
  //   });
  logger.info('test', { latency: new Date() - start });
  res.send('successful test');
});


// module.exports = app;
module.exports = app.listen(port, () => console.log(`Listening on port ${port}`));

