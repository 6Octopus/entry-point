const client = require('../server/elasticsearch/elasticsearch.js');
const faker = require('faker');


for (let j = 0; j < 200; j += 1) {
  const autoBody = [];
  console.log(j * 50000);
  for (let i = 0; i < 50000; i += 1) {
    const index = {
      index: { _index: 'autocomplete', _id: i },
    };
    const autoData = {
      query: faker.random.words(),
      querycount: Math.floor(Math.random() * 10000),
      timestamp: faker.date.between('2017-01-01', '2017-12-31'),
    };
    autoBody.push(index);
    autoBody.push(autoData);
    client.bulk({
      index: 'autocomplete',
      type: 'video',
      body: autoBody,
    })
      .then(() => {
        // console.log('ECREATE', response);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
