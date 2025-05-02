const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranks')
    .setDescription('Display all unlockable ranks and the required levels.'),
    
  async execute(interaction) {
    // Check if rankRoles is configured
    const rankRoles = config.rankRoles;
    if (!rankRoles) {
      return interaction.reply({ content: 'Rank roles are not configured.', ephemeral: true });
    }

    // Transform rankRoles into an array of objects and sort them by level (numerically ascending)
    const ranks = Object.entries(rankRoles)
      .map(([level, roleTitle]) => ({ level: Number(level), roleTitle }))
      .sort((a, b) => a.level - b.level);

    // Create fields for each rank tier for the embed
    const fields = ranks.map(rank => ({
      name: `Level ${rank.level}`,
      value: rank.roleTitle,
      inline: true
    }));

    // Build the embed
    const embed = new EmbedBuilder()
      .setTitle('🏆 Rank Ladder')
      .setDescription('Here are all the unlockable ranks and the levels required for each:')
      .setColor(0x3498db)
      .addFields(fields)
      .setFooter({ text: 'Cain • Ranking System' })
      .setTimestamp();

    // Reply with the embed
    return interaction.reply({ embeds: [embed] });
  }
};
