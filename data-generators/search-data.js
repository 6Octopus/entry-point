const fs = require('fs');
const client = require('../server/elasticsearch/elasticsearch.js');
const readline = require('readline');

let lines = 0;
let searchBody = [];

const lineReader = readline.createInterface({
  input: fs.createReadStream('D://Thesis/data/snippets.export.json'),
});

lineReader.on('line', (line) => {
  if (lines > 350000) {
    const snippet = JSON.parse(line);
    const index = {
      index: { _index: 'search', _id: snippet._id },
    };
    const searchData = {
      title: snippet.title,
      tags: snippet.tags,
      views: Math.floor(Math.random() * 100000),
    };
    searchBody.push(index);
    searchBody.push(searchData);
    lines += 1;

    if ((lines + 1) % 50000 === 0) {
      console.log(lines);
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
      searchBody = [];
    }
    if (lines % 50000 === 0) {
      console.log('PAUSE');
      lineReader.pause(); // pause reader
      // Resume 5ms later
      setTimeout(() => {
        lineReader.resume();
      }, 10000);
    }
  } else {
    lines += 1;
    if (lines % 1000000 === 0) {
      console.log(lines);
    }
  }
});
