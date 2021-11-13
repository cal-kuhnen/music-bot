const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exit')
		.setDescription('Stops audio, boots bot from voice channel.'),
	async execute(interaction) {
    await interaction.reply('Bye!');
    player.exit();
	},
};
