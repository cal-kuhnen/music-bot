const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips to the next song in the queue.'),
	async execute(interaction) {
    await interaction.reply('Skipping...');
    player.skip();
	},
};
