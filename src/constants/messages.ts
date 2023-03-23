import { EmbedBuilder } from 'discord.js';

export const pausedEmbed = new EmbedBuilder()
  .setColor('#3399ff')
  .setDescription('Paused');

export const stoppedEmbed = new EmbedBuilder()
  .setColor('#3399ff')
  .setDescription('Player stopped.');

export const skipEmbed = new EmbedBuilder()
  .setColor('#3399ff')
  .setDescription('Skipping...');

export const errorEmbed = new EmbedBuilder()
  .setColor('#ff2222')
  .setDescription('An error occurred during this request. Tell Calvin something is broken');

export const noInputEmbed = new EmbedBuilder()
  .setColor('#ff2222')
  .setDescription('Nothing to unpause, add a Youtube link or search query to queue audio');

export const failEmbed = new EmbedBuilder()
  .setColor('#ff2222')
  .setDescription('Audio player failure, RIP.');

export const emptyQueueEmbed = new EmbedBuilder()
  .setColor('#eedd00')
  .setDescription('Queue is empty!');

export const notInChannelEmbed = new EmbedBuilder()
  .setColor('#ff2222')
  .setDescription('You must be in a voice channel to play audio!');
  
export const exitEmbed = new EmbedBuilder()
  .setColor('#3399ff')
  .setDescription('Peace son');