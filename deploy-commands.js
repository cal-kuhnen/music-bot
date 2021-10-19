import dotenv from 'dotenv/config';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with pong'),
  new SlashCommandBuilder().setName('server').setDescription('Replies with server info')
]
  .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT, process.env.TESTGUILD), { body: commands })
  .then(() => console.log('Successfully registered commands.'))
  .catch(console.error);
