import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, Collection } from 'discord.js';

export interface CommandClient extends Client {
  commands: Collection<string, Command>;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: Function;
}