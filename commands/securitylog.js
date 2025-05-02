const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isRateLimited } = require('../utils/rateLimiter');

const securityLogPath = path.join(__dirname, '../logs/security.log');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('securitylog')
    .setDescription('View or clear the security log.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('last')
        .setDescription('Show the last few security log entries')
        .addIntegerOption(option =>
          option.setName('count')
            .setDescription('How many entries to show (default: 10)')
            .setMinValue(1)
            .setMaxValue(50)
        )
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Clear the security log')
    ),

  async execute(interaction) {
    if (isRateLimited(interaction.user.id, 5000)) {
      return interaction.reply({ content: '⏳ Slow down! Try again shortly.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'last') {
      const count = interaction.options.getInteger('count') || 10;

      try {
        const data = fs.readFileSync(securityLogPath, 'utf8');
        const lines = data.trim().split('\n');
        const lastLines = lines.slice(-count);

        if (lastLines.length === 0) {
          return interaction.reply('🔍 Security log is currently empty.');
        }

        const formatted = lastLines.map(line => `• ${line}`).join('\n');
        return interaction.reply(`🛡️ Last ${lastLines.length} security events:\n\`\`\`\n${formatted}\n\`\`\``);
      } catch (err) {
        console.error(err);
        return interaction.reply('⚠️ Failed to read the security log.');
      }
    }

    if (subcommand === 'clear') {
      try {
        fs.writeFileSync(securityLogPath, '', 'utf8');
        return interaction.reply('🧹 Security log has been cleared.');
      } catch (err) {
        console.error(err);
        return interaction.reply('❌ Failed to clear the security log.');
      }
    }
  }
};
