const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require('../music.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays song')
		.addStringOption(option =>
			option.setName('link')
				.setDescription('Enter a Youtube link to be played.')
				.setRequired(false)),
	async execute(interaction) {
		const link = interaction.options.getString('link');
		let user = await interaction.member.fetch();
    let voiceChannel = await user.voice.channel;
		if (!voiceChannel) {
			await interaction.reply('You must be in a voice channel to play audio!');
		} else {
			player.play(link, voiceChannel, interaction);
		}
	},
};
