require('dotenv').config();
import * as fs from 'fs';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { CommandClient } from './models/command.model';
import commands from './commands';
import { player } from './music';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
}) as CommandClient;

client.commands = new Collection();

commands.forEach(command => {
  client.commands.set(command.data.name, command);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.once('ready', () => {
	console.log('Ready!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.member?.id !== client.user?.id && oldState.channelId) {
    player.checkEmptyChannel(newState.channelId);
  }
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
