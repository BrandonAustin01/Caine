// commands/status.js

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  InteractionResponseFlags
} = require('discord.js');
const os = require('os');
const process = require('node:process');
const prettyBytes = require('pretty-bytes'); // ✅ Make sure this is installed
const config = require('../config/config.json');
const versionData = require('../version.json');
const lockdown = require('../utils/lockdownState');
const pkg = require('../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('View Cain’s security status and system info.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const startedAt = versionData.started ? new Date(parseInt(versionData.started)) : null;
    const uptimeMs = Date.now() - parseInt(versionData.started || Date.now());
    const uptimeMinutes = Math.floor(uptimeMs / 60000);
    const uptime = uptimeMinutes < 1 ? 'Less than 1 minute' : `${uptimeMinutes} min`;

    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Cain Status Report')
      .setColor(lockdown.status() ? 0xffaa00 : 0x00cc99)
      .addFields(
        { name: '🔒 Lockdown Mode', value: lockdown.status() ? '🟠 ENABLED' : '🟢 Disabled', inline: true },
        { name: '🧠 Uptime', value: uptime, inline: true },
        { name: '📦 Memory', value: `${prettyBytes(usedMem)} / ${prettyBytes(totalMem)}`, inline: true },
        { name: '🛡️ Anti-Raid', value: config.antiRaid.enabled
          ? `✅ Active (max ${config.antiRaid.maxJoins} in ${config.antiRaid.intervalMs / 1000}s)`
          : '❌ Disabled', inline: true },
        { name: '⚠️ Anti-Kick Abuse', value: config.antiKickAbuse.enabled
          ? `✅ Max ${config.antiKickAbuse.maxKicks} in ${config.antiKickAbuse.intervalMs / 1000}s\n🔄 Auto Lockdown: ${config.antiKickAbuse.autoLockdown ? '🟢 On' : '🔴 Off'}`
          : '❌ Disabled', inline: false },
        { name: '⚙️ Node.js', value: process.version, inline: true },
        { name: '📚 Discord.js', value: pkg.dependencies['discord.js']?.replace('^', 'v') || 'unknown', inline: true },
        { name: '🔖 Version', value: `v${versionData.version} (${versionData.build})`, inline: true }
      )
      .setFooter({ text: 'Cain • SecurityBot System Report' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: 1 << 6 // ✅ ephemeral response
    });
  }
};
