import dotenv from 'dotenv/config';
import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Client, Intents, Collection } from 'discord.js';

const client = new Client({ intents: [Intents.FLAGS.GUILDS]});

client.once('ready', () => {
	console.log('Ready!');
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
