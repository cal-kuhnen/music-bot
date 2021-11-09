const ytsr = require('ytsr');

const youtubeSearch = async (query) => {
  try {
    const filters = await ytsr.getFilters(query);
    const vidFilter = filters.get('Type').get('Video');
    const results = await ytsr(vidFilter.url, { limit: 1 });
    const song = {
      title: results.items[0].title,
      url: results.items[0].url
    };
    console.log(`YtSearch: title is ${song.title}`);
    return song;
  } catch (error) {
    console.error(error);
  }
}

exports.search = youtubeSearch;
