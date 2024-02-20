import { BaseGuildVoiceChannel, Message, EmbedBuilder } from 'discord.js'
import { Song } from "./models/player.model";
import { 
  pausedEmbed, 
  errorEmbed, 
  noInputEmbed, 
  failEmbed, 
  emptyQueueEmbed, 
  exitEmbed,
  resumingEmbed,
  noAudioEmbed,
  cannotRemoveEmbed,
  removedEmbed
} from "./constants/messages";
const ytcore = require('ytdl-core');
import {
  AudioPlayer,
  VoiceConnection,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnectionStatus,
  entersState,
  AudioPlayerStatus,
  getVoiceConnection,
} from '@discordjs/voice';
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
      this.channel.send({embeds: [failEmbed]});
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
      await interaction.reply({embeds: [resumingEmbed]});
      return;
    } else if (!input) {
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
      await interaction.reply({embeds: [errorEmbed]});
      return;
    }

    if (!getVoiceConnection(this.channel.guild.id)) {
      const connection = await this.connectToChannel(voiceChannel);
      const subscription = connection.subscribe(this.audio);

      if (!getVoiceConnection(this.channel.guild.id) && subscription) {
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
        const nowPlayingEmbed = new EmbedBuilder()
          .setColor('#3399ff')
          .addFields({ name: 'Now playing', value: `[${this.queue[0].title}](${this.queue[0].url})` });
        this.channel.send({embeds: [nowPlayingEmbed]})
          .then(message => this.playingMsg = message)
          .catch(console.error);
      } catch(e) {
        console.log(e);
      }
    }
  }

  pause = async (interaction) => {
    if (this.audio.state.status === AudioPlayerStatus.Playing) {
      this.audio.pause();
      await interaction.reply({embeds: [pausedEmbed]});
    } else {
      await interaction.reply({embeds: [noAudioEmbed]});
    }
  }

  skip = () => {
    this.audio.stop();
  }

  stop = () => {
    this.played.push(this.queue.shift()!);
    this.queue = [];
    this.audio.stop();
  }

  remove = async (trackID: number, interaction) => {

    if (trackID - this.played.length - 1 === 0) {
      await interaction.reply({embeds: [cannotRemoveEmbed]});
      return;
    }

    if (trackID < 1 || trackID > (this.played.length + this.queue.length)) {
      await interaction.reply('That index is out of range; try the queue command to see which indices are in use');
    } else if (trackID <= this.played.length) {
      const removedName = this.played[trackID - 1].title;
      this.played.splice(trackID - 1, 1);
      await interaction.reply({embeds: [removedEmbed(removedName)]});
    } else {
      const removedName = this.queue[(trackID - this.played.length - 1)].title;
      this.queue.splice((trackID - this.played.length - 1), 1);
      await interaction.reply({embeds: [removedEmbed(removedName)]});
    }

  }

  printQueue = async (interaction) => {

    const fullQueue = this.played.concat(this.queue);

    if (fullQueue.length === 0) {
      await interaction.reply({embeds: [emptyQueueEmbed]});
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
    const upNextEmbed = new EmbedBuilder()
      .setColor('#eedd00')
      .setDescription(songList);

    await interaction.reply({embeds: [upNextEmbed]});
  }

  exit = () => {
    const connection = getVoiceConnection(this.channel.guild.id);
    if (connection) {
      this.audio.stop();
      if (this.playingMsg) this.playingMsg.delete();
      connection.destroy();
    }
  }

  checkEmptyChannel = (newChannel: string | null) => {
    if (newChannel !== this.channel?.id && this.channel?.members?.size < 3) {
      this.channel.send({embeds: [exitEmbed]})
      this.exit();
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