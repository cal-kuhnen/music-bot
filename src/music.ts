import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { BaseGuildVoiceChannel, Message, EmbedBuilder } from 'discord.js'
import { Song } from "./models/player.model";
const ytcore = require('ytdl-core');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnectionStatus,
  entersState,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
import { youtubeSearch } from './youtube';
const play = require('play-dl');

class MusicPlayer {
  queue: Song[] = [];
  played: Song[] = [];
  audio: AudioPlayer;
  connection: VoiceConnection;
  channel: BaseGuildVoiceChannel;
  playingMsg: Message;
  constructor() {
    this.audio = createAudioPlayer();
    this.playingMsg;

    // On idle, play next song if it exists otherwise chill
    this.audio.on(AudioPlayerStatus.Idle, async () => {
      if (this.queue.length > 1) {
        this.played.push(this.queue.shift()!);
        const source = await play.stream(this.queue[0].url, { quality: 2 });
        this.audio.play(createAudioResource(source.stream, {
          inputType: source.type
        }));
      } else {
        if (this.queue.length > 0) {
          this.played.push(this.queue.shift()!);
        }
        if (this.playingMsg) {
          this.playingMsg.delete();
        }
      }
    });

    // On error, try to play next song
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

      await interaction.reply({embeds: [noInputEmbed]});
      return;
    }

    let song;

    if (ytcore.validateURL(input)) {
      const songInfo = await ytcore.getInfo(input);
      song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
      };
    } else {
      song = await youtubeSearch(input);
    }

    if (!song) {
      const errorEmbed = new MessageEmbed()
        .setColor('#ff2222')
        .setDescription('An error occurred during this request. Tell Calvin something is broken');

      await interaction.reply({embeds: [errorEmbed]});
      return;
    }

    if (!this.connection) {
      this.connection = await this.connectToChannel(voiceChannel);
      const subscription = this.connection.subscribe(this.audio);

      if (!this.connection && subscription) {
        setTimeout(() => subscription.unsubscribe(), 5000);
      }
    }

    this.queue.push(song);
    const queuedEmbed = new EmbedBuilder()
      .setColor('#3399ff')
      .setDescription(`Queued [${song.title}](${song.url})`);

    await interaction.reply({embeds: [queuedEmbed]});

    if (this.queue.length === 1) {
      try {
        const source = await play.stream(song.url, { quality: 2 });
        this.audio.play(createAudioResource(source.stream, {
          inputType: source.type
        }));
      } catch(e) {
        console.log(e);
      }
    }
  }

  resourceBuilder = async () => {
    if (this.playingMsg) {
      this.playingMsg.delete();
    }

    const nowPlayingEmbed = new MessageEmbed()
      .setColor('#3399ff')
      .addFields('Now playing', `[${this.queue[0].title}](${this.queue[0].url})`);
    this.channel.send({embeds: [nowPlayingEmbed]})
      .then(message => this.playingMsg = message)
      .catch(console.error);
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
    this.played.push(this.queue.shift()!);
    this.queue = [];
    this.audio.stop();
  }

  remove = async (trackID, interaction) => {

    if (trackID - this.played.length - 1 === 0) {
      await interaction.reply('Cannot remove currently playing song');
      return;
    }

    if (trackID < 1 || trackID > (this.played.length + this.queue.length)) {
      await interaction.reply('That index is out of range; try the queue command to see which indices are in use');
    } else if (trackID <= this.played.length) {
      const removedName = this.played[trackID - 1].title;
      this.played.splice(trackID - 1, 1);
      await interaction.reply(`Removed ${removedName} from the queue`);
    } else {
      const removedName = this.queue[(trackID - this.played.length - 1)].title;
      this.queue.splice((trackID - this.played.length - 1), 1);
      await interaction.reply(`Removed ${removedName} from the queue`);
    }

  }

  printQueue = async (interaction) => {

    const fullQueue = this.played.concat(this.queue);

    if (fullQueue.length === 0) {
      const upNextEmbed = new MessageEmbed()
        .setColor('#eedd00')
        .setDescription('Queue is empty!');

      await interaction.reply({embeds: [upNextEmbed]});
      return;
    }

    let songList = '```ml\n';
    for (let i = 0; i < fullQueue.length; i++) {

      if ((i - this.played.length - 1) === 0) {
        songList += `-- Currently Playing --\n${i + 1}) ${fullQueue[i].title} "\n-- Up Next --\n`;
      } else {
        songList += `${i + 1}) ` + fullQueue[i].title + `\n`;
      }
    }

    songList += '```';
    const upNextEmbed = new MessageEmbed()
      .setColor('#eedd00')
      .setDescription(songList);

    await interaction.reply({embeds: [upNextEmbed]});
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
  // 5.

}

export const player = new MusicPlayer();