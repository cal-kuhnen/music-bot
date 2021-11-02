const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pauses any currently playing audio.'),
	async execute(interaction) {
    player.pause(interaction);
	},
};
