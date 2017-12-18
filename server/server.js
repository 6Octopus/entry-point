const express = require('express');
const bodyParser = require('body-parser');
const client = require('./elasticsearch/elasticsearch.js');
// const axios = require('axios');
// const consumer = require('sqs-consumer');

const app = express();

app.use(bodyParser.json());

const port = process.env.PORT || 7331;

app.get('/search', (req, res) => {
  // send a request to search elastic
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
        client.update({
          index: 'autocomplete',
          type: 'doc',
          id: response.hits.hits[0]._id,
          body: {
            script: 'ctx._source.querycount += 1',
            upsert: {
              querycount: 1,
            },
          },
        })
          .then((response) => {
            console.log('EUPDATE', response);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        // doesn't exist, so create it
        client.index({
          index: 'autocomplete',
          type: 'doc',
          body: {
            query: req.body.title,
            querycount: 1,
            timestamp: new Date(),
          },
        })
          .then((response) => {
            console.log('ECREATE', response);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log('DID NOT FIND', err);
    });
});

app.get('/queries', (req, res) => {
  // send a request to autocomplete elastic
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
});

app.get('/video', (req, res) => {
  // send a request to videos service
  res.send('GET video');
});

app.get('/related', (req, res) => {
  // send a request to related service
  res.send('GET related');
});

app.post('/update', (req, res) => {
  // send a request to update service
  res.send('POST update');
});

app.post('/viewed', (req, res) => {
  // send a request to viewed service
  res.send('POST viewed');
});


module.exports = app.listen(port, () => console.log(`Listening on port ${port}`));

