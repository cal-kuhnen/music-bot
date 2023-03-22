require('dotenv').config();
import * as fs from 'fs';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Command, CommandClient } from './models/command.model';
import { Commands } from './commands';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
}) as CommandClient;

client.commands = new Collection();

Commands.forEach(command => {
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

// Login to Discord with your client's token
client.login(process.env.TOKEN);
