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
const youtube = require('./youtube.js');

class MusicPlayer {
  constructor() {
    this.queue = [];
    this.played = [];
    this.audio = createAudioPlayer();
    this.connection = null;
    this.channel = null;
    this.playingMsg;

    // On idle, play next song if it exists otherwise chill
    this.audio.on(AudioPlayerStatus.Idle, async () => {
      if (this.queue.length > 1) {
        this.played.push(this.queue.shift());
        this.audio.play(await this.resourceBuilder());
      } else {
        if (this.queue.length > 0) {
          this.played.push(this.queue.shift());
        }
        if (this.playingMsg) {
          this.playingMsg.delete();
          this.playingMsg = null;
        }
      }
    });

    // On error, try to play next song - mainly for the Node.js v16 issue
    this.audio.on('error', async (error) => {
      console.error(error);
      const errorEmbed = new MessageEmbed()
        .setColor('#ff2222')
        .setDescription('Audio player failure, RIP.');

      this.channel.send({embeds: [errorEmbed]});
      this.audio.stop();
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

  play = async (input, voiceChannel, interaction) => {
    this.channel = await interaction.client.channels.cache.get(interaction.channelId);

    if(!input && this.audio.state.status === AudioPlayerStatus.Paused) {
      this.audio.unpause();
      await interaction.reply('Resuming...');
      return;
    } else if (!input) {
      const noInputEmbed = new MessageEmbed()
        .setColor('#ff2222')
        .setDescription('Nothing to unpause, add a Youtube link or search query to queue audio');

      interaction.reply({embeds: [noInputEmbed]});
      return;
    }

    let song;

    if (ytdl.validateURL(input)) {
      const songInfo = await ytdl.getInfo(input);
      song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
      };
    } else {
      song = await youtube.search(input);
    }

    if (!song) {
      const errorEmbed = new MessageEmbed()
        .setColor('#ff2222')
        .setDescription('An error occurred during this request. Tell Calvin something is fucked');

      interaction.reply({embeds: [errorEmbed]});
      return;
    }

    if (!this.connection) {
      this.connection = await this.connectToChannel(voiceChannel);
      const subscription = this.connection.subscribe(this.audio);

      if (!subscription) {
        setTimeout(() => subscription.unsubscribe(), 5000);
      }
    }

    this.queue.push(song);
    const queuedEmbed = new MessageEmbed()
      .setColor('#3399ff')
      .setDescription(`Queued [${song.title}](${song.url})`);

    await interaction.reply({embeds: [queuedEmbed]});

    if (this.queue.length === 1) {
      this.audio.play(await this.resourceBuilder());
    }
  }

  resourceBuilder = async () => {

    if (this.playingMsg) {
      this.playingMsg.delete();
      this.playingMsg = null;
    }
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
    this.played.push(this.queue.shift());
    this.queue = [];
    this.audio.stop();
  }

  printQueue = (interaction) => {

    const fullQueue = this.played.concat(this.queue);

    if (fullQueue.length === 0) {
      const upNextEmbed = new MessageEmbed()
        .setColor('#eedd00')
        .setDescription('Queue is empty!');

      interaction.reply({embeds: [upNextEmbed]});
      return;
    }

    let songList = '```ml\n';
    for (let i = 0; i < fullQueue.length; i++) {

      if (fullQueue[i] === this.queue[0]) {
        songList += `-- Currently Playing --\n${i + 1}) ${fullQueue[i].title} "\n-- Up Next --\n`;
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

  exit = () => {
    if (this.connection) {
      this.audio.stop();
      this.connection.destroy();
    }
  }

  // TODO
  // 1. Add remove command
  // 2. In case of audio player error, attempt to restart the resource at the
  //    time it failed for minimal disturbance
  // 3. Have bot disconnect when there are no other users in the voice channel
  // 4. Add messager functions elsewhere to clean up this code

}

player = new MusicPlayer();
module.exports = player;
