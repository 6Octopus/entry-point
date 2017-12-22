const express = require('express');
const bodyParser = require('body-parser');
const client = require('./elasticsearch/elasticsearch.js');
const axios = require('axios');
const uuid = require('uuid/v4');
const SQS = require('./SQS.js');
const winston = require('winston');
const Elasticsearch = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  client,
};

const logger = new winston.Logger({
  transports: [
    new Elasticsearch(esTransportOpts),
  ],
});


const tempCacheObject = {};

const handleMessage = function handleMessage(message) {
  const start = Date.now();
  const response = JSON.parse(message.Body);
  if (response.route === '/update') {
    if (response.method === 'POST') {
      // update database
      console.log(message.Body);
    }
  } else {
    const res = tempCacheObject[response.id];
    // TODO: uncomment this, ES running out of queue space,
    // may need to find a better way to log
    res && res.send(response.data);
  }
  const finish = Date.now();
  logger.info({ latency: start - finish });
};

const receiveQueueURL = process.env.ENTRY_QUEUE_FAKE;

const receiveWrapper = async function receiveWrapper() {
  while (true) {
    await SQS.receiveFromQueue(receiveQueueURL, handleMessage);
  }
};
for (let i = 0; i < 1; i += 1) {
  receiveWrapper();
}


const app = express();

exports.myApp = app;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 7331;

app.get('/search', (req, res) => {
  // console.log(res);
  // await receive();
  console.log(req.body.title);
  // send a request to search elastic
  const start = new Date();
  client.search({
    index: 'search',
    type: 'video',
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
      console.log(err);
    });
    /*
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
    */
  const finish = new Date();
  logger.info({ latency: start - finish });
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
  const sendQueueURL = process.env.VIDEO_QUEUE_URL;
  const msg = {
    // id is for caching res
    // route is /videos
    // resUrl is my queue
    // method is GET to get a video
    id: responseID,
    route: '/videos',
    resUrl: process.env.ENTRY_QUEUE_URL,
    method: 'GET',
    // actual video request info
    data: {
      id: req.query.id,
      part: req.query.part,
    },
  };
  tempCacheObject[responseID] = res;
  SQS.sendToQueue(sendQueueURL, msg);
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
  // axios.post('historyUrl/viewed')
  //   .then((response) => {
  //     res.send(response.data);
  //   })
  //   .catch((err) => {
  //     throw err;
  //   });
});

module.exports = app.listen(port, () => console.log(`Listening on port ${port}`));

