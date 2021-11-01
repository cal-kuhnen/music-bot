const ytdl = require("ytdl-core");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnectionStatus,
  entersState,
  AudioPlayerStatus
} = require('@discordjs/voice');

class MusicPlayer {
  constructor() {
    this.queue = [];
    this.audio = createAudioPlayer();
    this.connection = null;
    this.channel = null;

    this.audio.on(AudioPlayerStatus.Idle, async () => {
      if (this.queue.length > 1) {
        let nextSong = await this.nextSong();
        this.audio.play(nextSong);
      } else {
        this.queue.shift();
      }
    });

    this.audio.on('error', async (error) => {
      console.error(error);
      if (this.queue.length > 1) {
        let nextSong = await this.nextSong();
        this.audio.play(nextSong);
      }
    });
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

  play = async (link, voiceChannel, interaction) => {
    this.channel = await interaction.client.channels.cache.get(interaction.channelId);

    if (!this.connection) {
      this.connection = await this.connectToChannel(voiceChannel);
      const subscription = this.connection.subscribe(this.audio);

      if (!subscription) {
        setTimeout(() => subscription.unsubscribe(), 5000);
      }
    }

    if (!ytdl.validateURL(link)) {
      await interaction.reply('Please use a YouTube link!');
      return;
    }

    const songInfo = await ytdl.getInfo(link);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    }
    this.queue.push(song);
    await interaction.reply(`Queued: ${song.title}`);

    if (this.queue.length === 1) {
      const stream = ytdl(this.queue[0].url, { filter: 'audioonly' });
      const resource = createAudioResource(stream, {seek: 0, volume: 1});
      this.channel.send(`Now playing: ${this.queue[0].title}`);
      this.audio.play(resource);
    }

    //console.log(this.queue);
  }

  nextSong = async () => {
    this.queue.shift();
    console.log(this.queue);
    try {
      const stream = await ytdl(this.queue[0].url, { filter: 'audioonly' });
      const resource = await createAudioResource(stream, {seek: 0, volume: 1});
      this.channel.send(`Now playing: ${this.queue[0].title}`);
      return resource;
    } catch (error) {
      console.error(error);
    }
  }
}

player = new MusicPlayer();
module.exports = player;
