import { Song } from "./models/player.model";

const yts = require('yt-search');

export const youtubeSearch = async (query: string) => {
  try {
    const result = await yts(query);
    const firstResult = result.videos[0];
    const song: Song = {
        title: firstResult.title,
        url: firstResult.url,
      };
    return song;
  } catch (error) {
    console.log(error);
  }
}