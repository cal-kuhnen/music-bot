const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Prints upcoming songs in the queue.'),
	async execute(interaction) {
    player.printQueue(interaction);
	},
};
