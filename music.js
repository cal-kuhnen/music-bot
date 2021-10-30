const ytdl = require("ytdl-core");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

class MusicPlayer {
  constructor() {
    this.queue = [];
    this.audio = createAudioPlayer();
    this.connection = null;
  }

  connectToChannel = async (channel) => {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
      return connection;
    } catch (error) {
      connection.destroy();
      throw error;
    }
  }

  play = async (link, voiceChannel) => {
    if (!this.connection) {
      this.connection = await this.connectToChannel(voiceChannel);
      const subscription = this.connection.subscribe(this.audio);

      if (!subscription) {
        setTimeout(() => subscription.unsubscribe(), 5000);
      }
    }
    const songInfo = await ytdl.getInfo(link);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    }
    const stream = ytdl(song.url, { filter: 'audioonly' });
    const resource = createAudioResource(stream, {seek: 0, volume: 1});
    this.audio.play(resource);
    this.queue.push(song);
    console.log(this.queue);
  }
}

player = new MusicPlayer();
module.exports = player;
