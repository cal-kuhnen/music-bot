const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays song'),
	async execute(interaction) {
		await interaction.reply('never gonna give you up');
	},
};
