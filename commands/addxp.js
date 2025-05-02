const { SlashCommandBuilder } = require('discord.js');
const { addXp, getUserStats } = require('../utils/levelSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('Admin only: Add XP to a user manually.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to give XP to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('How much XP to add')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔒 Require admin permission
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You must be an administrator to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    // ✅ Add XP using your main level system
    const result = await addXp(user.id, guildId, amount, interaction.client);
    const updatedStats = getUserStats(user.id, guildId);

    let msg = `✅ Added \`${amount}\` XP to **${user.tag}**.\n📊 New total: \`${updatedStats.xp}\` XP, Level \`${updatedStats.level}\``;

    if (result.leveledUp) {
      msg += `\n🎉 Leveled up to **Level ${result.level}**!`;
      if (result.reward) msg += `\n🏅 Awarded role: **${result.reward}**`;
    }

    return interaction.reply({ content: msg, ephemeral: true });
  }
};
