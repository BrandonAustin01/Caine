// commands/status.js

const { EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const versionData = require('../version.json');
const lockdown = require('../utils/lockdownState');
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  name: 'status',
  description: 'View Cain\'s security status and system info.',
  async execute(message) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You must be an admin to use this command.');
    }

    const startedAt = versionData.started ? new Date(parseInt(versionData.started)) : null;
    const uptimeMs = Date.now() - parseInt(versionData.started || Date.now());
    const uptimeMinutes = Math.floor(uptimeMs / 60000);
    const uptime = uptimeMinutes < 1
      ? 'Less than 1 minute'
      : `${uptimeMinutes} minute(s)`;

    const statusEmbed = new EmbedBuilder()
      .setTitle(`🛡️ Cain Security Status`)
      .setColor(lockdown.status() ? 0xffaa00 : 0x00cc99)
      .addFields(
        { name: 'Lockdown Mode', value: lockdown.status() ? '🔒 ENABLED' : '🔓 Disabled', inline: true },
        { name: 'Anti-Raid', value: config.antiRaid.enabled ? `✅ Active (Max ${config.antiRaid.maxJoins} in ${config.antiRaid.intervalMs / 1000}s)` : '❌ Disabled', inline: true },
        { name: 'Anti-Kick Abuse', value: config.antiKickAbuse.enabled ? `✅ Active (Max ${config.antiKickAbuse.maxKicks} in ${config.antiKickAbuse.intervalMs / 1000}s)\nAuto Lockdown: ${config.antiKickAbuse.autoLockdown ? '🟢 On' : '🔴 Off'}` : '❌ Disabled', inline: false },
        { name: 'Version', value: `v${versionData.version} (${versionData.build})`, inline: true },
        { name: 'Uptime', value: uptime, inline: true }
      )
      .setFooter({ text: 'Cain • SecurityBot System Report' })
      .setTimestamp();

    return message.reply({ embeds: [statusEmbed] });
  }
};
