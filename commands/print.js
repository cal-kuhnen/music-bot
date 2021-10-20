const list = require('../music.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('print')
		.setDescription('prints array contents'),
	async execute(interaction) {
    var msg = list.q.print();
		await interaction.reply(msg);
	},
};
