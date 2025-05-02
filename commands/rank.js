const {
    SlashCommandBuilder,
    EmbedBuilder
  } = require('discord.js');
  const { getUserStats, getLevelFromXp } = require('../utils/levelSystem');
  
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
      const user = interaction.options.getUser('user') || interaction.user;
      const stats = getUserStats(user.id, interaction.guild.id);
      const nextLevel = stats.level + 1;
      const xpForNext = Math.ceil((nextLevel ** 2) * 10);
  
      const embed = new EmbedBuilder()
        .setTitle(`🏅 Rank for ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(0x3498db)
        .addFields(
          { name: '📊 Level', value: `${stats.level}`, inline: true },
          { name: '🔢 Total XP', value: `${stats.xp}`, inline: true },
          { name: '⏭️ XP to Next', value: `${xpForNext - stats.xp}`, inline: true }
        )
        .setFooter({ text: 'Cain • Ranking System' })
        .setTimestamp();
  
      return interaction.reply({ embeds: [embed], flags: 1 << 6 });
    }
  };
  