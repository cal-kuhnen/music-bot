const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops any audio and clears the queue.'),
	async execute(interaction) {
    await interaction.reply('Player stopped.');
    player.stop();
	},
};
