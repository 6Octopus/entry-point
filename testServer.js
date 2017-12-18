// const axios = require('axios');
// const fs = require('fs');
// const faker = require('faker');
// const client = require('./server/elasticsearch/elasticsearch.js');
// const readline = require('readline');
const axios = require('axios').create({baseURL: 'http://localhost:7331'});


// for (let i = 0; i < 10000; i += 1) {
//   if (i % 1000 === 0) {
//     console.log(i);
//   }
axios.get('/queries', { data: { title: 'bacon' } })
  .then((response) => {
    console.log(response.data.hits.hits);
    // console.log(response.data);
  });
// }

/*
let lines = 0;
let searchBody = [];

const lineReader = readline.createInterface({
  input: fs.createReadStream('D://Thesis/data/snippets.export.json'),
});

lineReader.on('line', (line) => {
  if (lines > 9000000) {
    const snippet = JSON.parse(line);
    const index = {
      index: { _index: 'search', _id: snippet._id },
    };
    const searchData = {
      title: snippet.title,
      description: snippet.description,
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
        type: 'doc',
        body: searchBody,
      })
        .then((response) => {
          //console.log('ECREATE', response);
        })
        .catch((err) => {
          console.log(err);
        });
      searchBody = [];
    }
  } else {
    lines+=1;
    if (lines % 1000000 === 0) {
      console.log(lines);
    }
  }
});
*/

/*
const readStream = fs.createReadStream('D://Thesis/data/snippets.export.json');
readStream.on('data', chunk => {
  const snippet = chunk.toString();
  console.log(JSON.parse(snippet));
  const index = {
    index: { _index: 'search', _id: snippet._id },
  };
  const searchData = {
    title: snippet.title,
    description: snippet.description,
    tags: snippet.tags,
    views: Math.floor(Math.random() * 2510),
  };
  file.write(`${JSON.stringify(index)}\n${JSON.stringify(searchData)}\n`);
});

*/

/*


for (let i = 0; i < 2000000; i++) {
  if (i % 100000 === 0) {
    console.log(i);
  }
  const index = {
    index: { _index: 'search', _id: i },
  };
  const searchData = {
    query: faker.random.words(),
    querycount: Math.floor(Math.random() * 10000),
    timestamp: faker.date.between('2017-01-01', '2017-12-31'),
  };
  file.write(`${JSON.stringify(index)}\n${JSON.stringify(autoData)}\n`);
}
*/
/*
const file = fs.createWriteStream('testData.json', { flags: 'a' });

for (let i = 2000000; i < 4000000; i++) {
  if (i % 100000 === 0) {
    console.log(i);
  }
  const index = {
    index: { _index: 'autocomplete', _id: i },
  };
  const autoData = {
    query: faker.random.words(),
    querycount: Math.floor(Math.random() * 10000),
    timestamp: faker.date.between('2017-01-01', '2017-12-31'),
  };
  file.write(`${JSON.stringify(index)}\n${JSON.stringify(autoData)}\n`);
}

file.end();
*/

/*
for (let i = 0; i < 1000; i += 1) {
  axios.get('https://sqs.us-west-1.amazonaws.com/486073289734/videosSend?Action=SendMessage&MessageBody=hi')
    .then((response) => {
      // console.log(response.data);
    })
    .catch((err) => {
      console.log(err.response);
    });
}
*/
