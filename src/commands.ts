import { SlashCommandBuilder } from '@discordjs/builders';
import { player } from './music'; 
import { Command } from './models/command.model';
import { exitEmbed, notInChannelEmbed, skipEmbed, stoppedEmbed } from './constants/messages';

const Commands: Command[] = [
  // Play
  {
    data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Plays song')
      .addStringOption(option =>
        option.setName('input')
          .setDescription('Enter a Youtube link or search query to play a song.')
          .setRequired(false)) as SlashCommandBuilder,
    async execute(interaction) {
      const input = interaction.options.getString('input');
      let user = await interaction.member.fetch();
      let voiceChannel = await user.voice.channel;
      if (!voiceChannel) {
        await interaction.reply({embeds: [notInChannelEmbed]});
      } else {
        player.play(input, voiceChannel, interaction);
      }
    }
  },
  // Pause
  {
    data: new SlashCommandBuilder()
      .setName('pause')
      .setDescription('Pauses any currently playing audio.'),
    async execute(interaction) {
      player.pause(interaction);
    }
  },
  // Stop
  {
    data: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Stops any audio and clears the queue.'),
    async execute(interaction) {
      await interaction.reply({embeds: [stoppedEmbed]});
      player.stop();
    },
  },
  // Skip
  {
    data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skips to the next song in the queue.'),
    async execute(interaction) {
      await interaction.reply({embeds: [skipEmbed]});
      player.skip();
    },
  },
  // Remove
  {
    data: new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Removes a track from the queue based on input')
      .addIntegerOption(option =>
        option.setName('input')
          .setDescription('Enter a number corresponding to a listing in the queue to remove it')
          .setRequired(true)) as SlashCommandBuilder,
    async execute(interaction) {
      const input = interaction.options.getInteger('input');
      player.remove(input, interaction);
    },
  },
  // Queue
  {
    data: new SlashCommandBuilder()
      .setName('queue')
      .setDescription('Prints upcoming songs in the queue.'),
    async execute(interaction) {
      player.printQueue(interaction);
    },
  },
  // Exit
  {
    data: new SlashCommandBuilder()
      .setName('exit')
      .setDescription('Stops audio, boots bot from voice channel.'),
    async execute(interaction) {
      await interaction.reply({embeds: [exitEmbed]});
      player.exit();
    },
  },
];

export default Commands;