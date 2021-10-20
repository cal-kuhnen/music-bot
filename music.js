const ytdl = require("ytdl-core");

class MusicPlayer {
  constructor() {
    this.queue = [];
  }

  play = async (link) => {
    this.queue.push(link);
    console.log(this.queue);
  }
}

player = new MusicPlayer();
module.exports = player;
