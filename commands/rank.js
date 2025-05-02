const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');
const { getUserStats, getLevelFromXp } = require('../utils/levelSystem');
const requireRankingEnabled = require('../utils/requireRankingEnabled');
const config = require('../config/config.json');

function getRankTitle(level) {
  const rankLevels = Object.keys(config.rankRoles)
    .map(Number)
    .sort((a, b) => a - b);

  let title = 'Unranked';
  for (const lvl of rankLevels) {
    if (level >= lvl) {
      title = config.rankRoles[lvl];
    } else {
      break;
    }
  }
  return title;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your current level and XP.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Check another user')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!requireRankingEnabled(interaction)) return;

    const user = interaction.options.getUser('user') || interaction.user;
    const stats = getUserStats(user.id, interaction.guild.id);
    const nextLevel = stats.level + 1;
    const xpForNext = Math.ceil((nextLevel ** 2) * 10);
    const rankTitle = getRankTitle(stats.level);

    const embed = new EmbedBuilder()
      .setTitle(`🏅 Rank for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor(0x3498db)
      .addFields(
        { name: '📊 Level', value: `${stats.level}`, inline: true },
        { name: '🔢 Total XP', value: `${stats.xp}`, inline: true },
        { name: '⏭️ XP to Next', value: `${xpForNext - stats.xp}`, inline: true },
        { name: '🏷️ Rank Title', value: rankTitle, inline: false }
      )
      .setFooter({ text: 'Cain • Ranking System' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: 1 << 6 });
  }
};
