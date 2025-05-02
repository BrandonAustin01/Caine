const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const requireRankingEnabled = require('../utils/requireRankingEnabled');

const xpPath = path.join(__dirname, '../data/xp.json');

let xpData = {};
try {
  const raw = fs.readFileSync(xpPath, 'utf8');
  xpData = raw ? JSON.parse(raw) : {};
} catch (err) {
  console.error('⚠️ Failed to load xp.json:', err);
  xpData = {};
}

const rankEmojis = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top 10 ranked users in this server.'),

  async execute(interaction) {
    if (!requireRankingEnabled(interaction)) return;

    const guildId = interaction.guild.id;

    if (!xpData[guildId]) {
      return interaction.reply({
        content: '❌ No leaderboard data available for this server.',
        ephemeral: true
      });
    }

    const users = Object.entries(xpData[guildId])
      .map(([userId, data]) => ({ userId, xp: data.xp, level: data.level }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);

    const leaderboard = await Promise.all(users.map(async (entry, index) => {
      const member = await interaction.guild.members.fetch(entry.userId).catch(() => null);
      const tag = member?.user?.tag || `User Left (${entry.userId})`;
      const emoji = rankEmojis[index] || `#${index + 1}`;
      return `${emoji} **${tag}** — Level ${entry.level}, ${entry.xp} XP`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('🏆 Cain Leaderboard — Top 10')
      .setDescription(leaderboard.join('\n'))
      .setColor(0xf1c40f)
      .setFooter({ text: 'Cain • Ranking System' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
