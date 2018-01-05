// curl -X GET "http://10.6.71.91:3000/videos?part=snippet,contentDetails,statistics,topicDetails&id=86BrPe-y1fk"

const response = {
  kind: 'youtube#videoListResponse',
  pageInfo: {
    totalResults: 1,
    resultsPerPage: 1,
  },
  Items: [{
    id: '86BrPe-y1fk',
    snippet: {
      publishedAt: '2015-03-26T16:17:57.000Z',
      channelId: 'UCKi2y-Kr3LqX1tJH3Qr9KfA',
      title: 'IMG 40631',
      description: 'Ryan Palmer Golf Swing R11s Driver. Too bad he can"t putt!!',
      thumbnails: {
        default: {
          url: 'https://i.ytimg.com/vi/86BrPe-y1fk/default.jpg',
        },
      },
      tags: ['Golf Swing', 'R11s Driver', '300 yards', 'Taylormade'],
      categoryId: '22',
    },
    contentDetails: { duration: 'PT13S' },
    statistics: { viewCount: '25' },
    topicDetails: {
      relevantTopicIds: ['/m/06ntj', '/m/06ntj', '/m/037hz'],
      topicCategories: ['https://en.wikipedia.org/wiki/Sport', 'https://en.wikipedia.org/wiki/Golf'],
    },
  }],
};
