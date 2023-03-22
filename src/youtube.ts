const ytsr = require('ytsr');

export const youtubeSearch = async (query) => {
  try {
    const filters = await ytsr.getFilters(query);
    const vidFilter = filters.get('Type').get('Video');
    const results = await ytsr(vidFilter.url, { limit: 1 });
    const song = {
      title: results.items[0].title,
      url: results.items[0].url
    };
    return song;
  } catch (error) {
    console.log(error);
  }
}