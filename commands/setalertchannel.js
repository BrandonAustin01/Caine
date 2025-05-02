const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/config.json');
let config = require(configPath);
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setalertchannel')
    .setDescription('Set the channel Cain should use for security alerts.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select a text channel for security alerts')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (isRateLimited(interaction.user.id, 5000)) {
      return interaction.reply({ content: '⏳ Slow down! Try again shortly.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');

    config.alertChannelId = channel.id;
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      return interaction.reply(`✅ Cain will now send security alerts to <#${channel.id}>.`);
    } catch (err) {
      console.error(err);
      return interaction.reply('❌ Failed to save the alert channel. Please try again.');
    }
  }
};
