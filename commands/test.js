const list = require('../music.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('trying module stuff')
    .addStringOption(option => option.setName('input').setDescription('Enter a string to be added!')),
	async execute(interaction) {
    const string = interaction.options.getString('input');
    list.q.add(string);
		await interaction.reply('Added!');
	},
};
