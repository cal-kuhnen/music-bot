const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Removes a track from the queue based on input')
		.addIntegerOption(option =>
			option.setName('input')
				.setDescription('Enter a number corresponding to a listing in the queue to remove it')
				.setRequired(true)),
	async execute(interaction) {
		const input = interaction.options.getInteger('input');
		player.remove(input, interaction);
	},
};
