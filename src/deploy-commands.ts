require('dotenv').config();
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import commands from './commands';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

const commandData: any[] = []
commands.forEach(command => commandData.push(command.data.toJSON()));

rest.put(Routes.applicationGuildCommands(process.env.CLIENT!, process.env.REALGUILD!), { body: commandData })
  .then(() => console.log('Successfully registered commands.'))
  .catch(console.error);
