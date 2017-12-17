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
        match: {
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
});

app.get('/queries', (req, res) => {
  // send a request to autocomplete elastic
  res.send('GET queries');
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

