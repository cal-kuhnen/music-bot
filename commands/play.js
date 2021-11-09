const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays song')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('Enter a Youtube link or search query to play a song.')
				.setRequired(false)),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		let user = await interaction.member.fetch();
    let voiceChannel = await user.voice.channel;
		if (!voiceChannel) {
			await interaction.reply('You must be in a voice channel to play audio!');
		} else {
			player.play(input, voiceChannel, interaction);
		}
	},
};
