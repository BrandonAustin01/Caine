const { SlashCommandBuilder } = require('discord.js');
const { getUserStats, addXp } = require('../utils/levelSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('Admin only: Set a user\'s XP manually for testing.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to set XP for')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('XP value to set')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need to be an administrator to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    // Directly update the XP and force a recalculation
    const xpData = require('../data/xp.json');
    if (!xpData[guildId]) xpData[guildId] = {};
    if (!xpData[guildId][user.id]) xpData[guildId][user.id] = { xp: 0, level: 0 };

    const userData = xpData[guildId][user.id];
    userData.xp = amount;

    // Force re-evaluation of level + role assignment
    const fs = require('fs');
    const path = require('path');
    const xpPath = path.join(__dirname, '../data/xp.json');
    fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2), 'utf8');

    // Re-trigger level up logic
    const result = await addXp(user.id, guildId, 0, interaction.client); // amount = 0 just triggers logic

    await interaction.reply({
      content: `✅ Set XP for **${user.tag}** to \`${amount}\`. New level: \`${result.level ?? getUserStats(user.id, guildId).level}\``,
      ephemeral: true
    });
  }
};
