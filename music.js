const ytdl = require("ytdl-core");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnectionStatus,
  entersState,
  AudioPlayerStatus
} = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');

class MusicPlayer {
  constructor() {
    this.queue = [];
    this.played = [];
    this.audio = createAudioPlayer();
    this.connection = null;
    this.channel = null;
    this.playingMsg;

    this.audio.on(AudioPlayerStatus.Idle, async () => {
      if (this.queue.length > 1) {
        this.audio.play(await this.nextSong());
      } else {
        this.queue.shift();
        if (this.playingMsg) {
          this.playingMsg.delete();
        }
      }
    });

    this.audio.on('error', async (error) => {
      console.error(error);
      this.audio.stop();
      this.channel.send('GOD DAMNIT');
      if (this.queue.length > 1) {
        this.audio.play(await this.nextSong());
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

    if(!link && this.audio.state.status === AudioPlayerStatus.Paused) {
      this.audio.unpause();
      await interaction.reply('Resuming...');
      return;
    }

    if (!ytdl.validateURL(link)) {
      await interaction.reply('Please use a YouTube link!');
      return;
    }

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
    };
    this.queue.push(song);
    const queuedEmbed = new MessageEmbed()
      .setColor('#3399ff')
      .setDescription(`Queued [${song.title}](${song.url})`);

    await interaction.reply({embeds: [queuedEmbed]});

    if (this.queue.length === 1) {
      const stream = ytdl(this.queue[0].url, { filter: 'audioonly' });
      const resource = createAudioResource(stream, {seek: 0, volume: 1});
      const nowPlayingEmbed = new MessageEmbed()
        .setColor('#3399ff')
        .addField('Now playing', `[${this.queue[0].title}](${this.queue[0].url})`);

      this.channel.send({embeds: [nowPlayingEmbed]})
        .then(message => this.playingMsg = message)
        .catch(console.error);

      this.audio.play(resource);
    }

    //console.log(this.queue);
  }

  nextSong = async () => {
    this.played.push(this.queue.shift());
    this.playingMsg.delete();
    //console.log(this.queue);
    try {
      const stream = await ytdl(this.queue[0].url, { filter: 'audioonly' });
      const resource = await createAudioResource(stream, {seek: 0, volume: 1});
      const nowPlayingEmbed = new MessageEmbed()
        .setColor('#3399ff')
        .addField('Now playing', `[${this.queue[0].title}](${this.queue[0].url})`);

      this.channel.send({embeds: [nowPlayingEmbed]})
        .then(message => this.playingMsg = message)
        .catch(console.error);

      return resource;
    } catch (error) {
      console.error(error);
    }
  }

  pause = async (interaction) => {
    if (this.audio.state.status === AudioPlayerStatus.Playing) {
      this.audio.pause();
      await interaction.reply('Paused!');
    } else {
      await interaction.reply('No audio to pause.');
    }
  }

  skip = async () => {
    this.audio.stop();
  }

  stop = async () => {
    this.queue = [];
    this.played = [];
    this.audio.stop();
  }

  printQueue = (interaction) => {
    const fullQueue = this.played.concat(this.queue);
    let songList = '```';
    for (let i = 0; i < fullQueue.length; i++) {
      if (fullQueue[i] === this.queue[0]) {
        songList += `Currently playing:\n${i + 1}) ${fullQueue[i].title} \n-- Up next --\n`;
      } else {
        songList += `${i + 1}) ` + fullQueue[i].title + `\n`;
      }
    }
    songList += '```';
    const upNextEmbed = new MessageEmbed()
      .setColor('#eedd00')
      .setDescription(songList);

    interaction.reply({embeds: [upNextEmbed]});
  }

}

player = new MusicPlayer();
module.exports = player;
