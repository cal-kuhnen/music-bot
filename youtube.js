const ytsr = require('ytsr');

const youtubeSearch = async (query) => {

  const vidFilter = await ytsr.getFilters(query);
  const filters = vidFilter.get('Type').get('Video');
  const results = await ytsr(filters.url, { limit: 1 });
  console.log(results.items[0].title);

}

youtubeSearch('ariel atom 4');
