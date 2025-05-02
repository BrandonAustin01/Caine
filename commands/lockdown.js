const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');
const lockdown = require('../utils/lockdownState');
const securityLog = require('../utils/securityLogger');
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Toggle server lockdown mode (blocks all new joins)')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Enable or disable lockdown mode')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (isRateLimited(interaction.user.id, 5000)) {
      return interaction.reply({ content: '⏳ Slow down! Try again shortly.', ephemeral: true });
    }

    const mode = interaction.options.getString('mode');

    if (mode === 'on') {
      lockdown.enable();
      logger.warn(`🔒 Lockdown ENABLED by ${interaction.user.tag}`);
      securityLog.log(`🔒 Lockdown enabled by ${interaction.user.tag}`);
      return interaction.reply('🔒 Lockdown mode is now **ENABLED**. All new joins will be blocked.');
    }

    if (mode === 'off') {
      lockdown.disable();
      logger.info(`🔓 Lockdown DISABLED by ${interaction.user.tag}`);
      securityLog.log(`🔓 Lockdown disabled by ${interaction.user.tag}`);
      return interaction.reply('🔓 Lockdown mode is now **DISABLED**. New members can join normally.');
    }
  }
};
