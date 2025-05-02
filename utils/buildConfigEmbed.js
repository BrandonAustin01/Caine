// utils/buildConfigEmbed.js

const { EmbedBuilder } = require('discord.js');

function buildAntiRaidEmbed(antiRaid) {
  return new EmbedBuilder()
    .setTitle('🛡️ Anti-Raid Settings')
    .setDescription('Live settings for Cain’s raid detection system.')
    .setColor(antiRaid.enabled ? 0x4caf50 : 0xf44336)
    .addFields(
      { name: '📌 Enabled', value: antiRaid.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
      { name: '👥 Max Joins', value: `\`${antiRaid.maxJoins}\``, inline: true },
      { name: '⏱️ Interval', value: `\`${antiRaid.intervalMs / 1000}s\``, inline: true },
      { name: '🚨 Punishment', value: `\`${antiRaid.punishment.toUpperCase()}\``, inline: true },
      { name: '🕒 Cooldown', value: `\`${antiRaid.cooldownMs / 1000}s\``, inline: true }
    );
}

function buildSpamFilterEmbed(spamFilter) {
  return new EmbedBuilder()
    .setTitle('🧹 Spam Filter Settings')
    .setDescription('Live settings for Cain’s spam detection system.')
    .setColor(spamFilter.enabled ? 0x4caf50 : 0xf44336)
    .addFields(
      { name: '📌 Enabled', value: spamFilter.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
      { name: '💬 Max Messages', value: `\`${spamFilter.maxMessages}\``, inline: true },
      { name: '⏱️ Interval', value: `\`${spamFilter.intervalMs / 1000}s\``, inline: true },
      { name: '⚖️ Punishment', value: `\`${spamFilter.punishment.toUpperCase()}\``, inline: true },
      { name: '🕒 Cooldown', value: `\`${spamFilter.cooldownMs / 1000}s\``, inline: true }
    );
}

function buildRankingEmbed(rankingSystem, rankRoles) {
  return new EmbedBuilder()
    .setTitle('🏅 Ranking System')
    .setDescription('Manage Cain’s XP-based leveling and role rewards.')
    .setColor(rankingSystem?.enabled ? 0x4caf50 : 0xf44336)
    .addFields(
      { name: '📌 Enabled', value: rankingSystem?.enabled ? '`✅ Yes`' : '`❌ No`', inline: true },
      {
        name: '🎯 Role Rewards',
        value: rankRoles ? `\`${Object.keys(rankRoles).length} levels\`` : '`None configured`',
        inline: true
      }
    );
}

module.exports = {
  buildAntiRaidEmbed,
  buildSpamFilterEmbed,
  buildRankingEmbed
};