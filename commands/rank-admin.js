const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config.json');
const xpPath = path.join(__dirname, '../data/xp.json');
const { addXp, getUserStats, getLevelFromXp } = require('../utils/levelSystem');
const requireRankingEnabled = require('../utils/requireRankingEnabled');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level or manage XP (admin only).')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('Check your rank and XP.')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Check another user')
            .setRequired(false)
        )
    )
    .addSubcommandGroup(group =>
      group.setName('admin')
        .setDescription('Admin tools for managing XP and levels')
        .addSubcommand(sub =>
          sub.setName('setxp')
            .setDescription('Set a user\'s XP.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
            .addIntegerOption(opt => opt.setName('amount').setRequired(true).setDescription('XP value'))
        )
        .addSubcommand(sub =>
          sub.setName('addxp')
            .setDescription('Add XP to a user.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
            .addIntegerOption(opt => opt.setName('amount').setRequired(true).setDescription('XP amount'))
        )
        .addSubcommand(sub =>
          sub.setName('reset')
            .setDescription('Reset a user\'s XP and level.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
        )
        .addSubcommand(sub =>
          sub.setName('removerole')
            .setDescription('Remove a user\'s rank role.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
        )
        .addSubcommand(sub =>
          sub.setName('promote')
            .setDescription('Promote user by X levels.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
            .addIntegerOption(opt => opt.setName('levels').setRequired(true).setDescription('Levels to add'))
        )
        .addSubcommand(sub =>
          sub.setName('demote')
            .setDescription('Demote user by X levels.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
            .addIntegerOption(opt => opt.setName('levels').setRequired(true).setDescription('Levels to remove'))
        )
        .addSubcommand(sub =>
          sub.setName('info')
            .setDescription('Show raw XP, level, and role info.')
            .addUserOption(opt => opt.setName('user').setRequired(true).setDescription('Target user'))
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup(false);

    // /rank view
    if (!group && sub === 'view') {
      if (!requireRankingEnabled(interaction)) return;
      const user = interaction.options.getUser('user') || interaction.user;
      const stats = getUserStats(user.id, interaction.guild.id);
      const nextLevel = stats.level + 1;
      const xpForNext = Math.ceil((nextLevel ** 2) * 10);

      // Rank title
      const rankLevels = Object.keys(config.rankRoles || {}).map(Number).sort((a, b) => a - b);
      let title = 'Unranked';
      for (const lvl of rankLevels) {
        if (stats.level >= lvl) title = config.rankRoles[lvl];
      }

      const embed = new EmbedBuilder()
        .setTitle(`🏅 Rank for ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(0x3498db)
        .addFields(
          { name: '📊 Level', value: `${stats.level}`, inline: true },
          { name: '🔢 Total XP', value: `${stats.xp}`, inline: true },
          { name: '⏭️ XP to Next', value: `${xpForNext - stats.xp}`, inline: true },
          { name: '🏷️ Rank Title', value: title, inline: false }
        )
        .setFooter({ text: 'Cain • Ranking System' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ✅ ADMIN COMMANDS BELOW
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const levels = interaction.options.getInteger('levels');
    const guildId = interaction.guild.id;
    const xpData = require('../data/xp.json');
    if (!xpData[guildId]) xpData[guildId] = {};
    if (!xpData[guildId][user.id]) xpData[guildId][user.id] = { xp: 0, level: 0 };

    const fs = require('fs');

    // /rank admin setxp
    if (sub === 'setxp') {
      xpData[guildId][user.id].xp = amount;
      fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
      await addXp(user.id, guildId, 0, interaction.client);
      return interaction.reply({ content: `✅ Set XP to \`${amount}\` for ${user.tag}.`, ephemeral: true });
    }

    // /rank admin addxp
    if (sub === 'addxp') {
      const result = await addXp(user.id, guildId, amount, interaction.client);
      const stats = getUserStats(user.id, guildId);
      return interaction.reply({
        content: `✅ Added \`${amount}\` XP to ${user.tag}. New XP: \`${stats.xp}\`, Level: \`${stats.level}\`` +
          (result.leveledUp ? `\n🎉 Leveled up to **Level ${result.level}**!` : ''),
        ephemeral: true
      });
    }

    // /rank admin reset
    if (sub === 'reset') {
      xpData[guildId][user.id] = { xp: 0, level: 0 };
      fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
      return interaction.reply({ content: `♻️ Reset XP and level for ${user.tag}.`, ephemeral: true });
    }

    // /rank admin removerole
    if (sub === 'removerole') {
      const stats = getUserStats(user.id, guildId);
      const level = stats.level;
      const eligible = Object.keys(config.rankRoles || {}).map(Number).filter(lvl => level >= lvl).sort((a, b) => b - a);
      if (!eligible.length) return interaction.reply({ content: 'No eligible rank role to remove.', ephemeral: true });

      const roleName = config.rankRoles[eligible[0]];
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (member && role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => {});
        return interaction.reply({ content: `✅ Removed role **${roleName}** from ${user.tag}.`, ephemeral: true });
      } else {
        return interaction.reply({ content: `⚠️ User doesn't have role ${roleName}.`, ephemeral: true });
      }
    }

    // /rank admin promote/demote
    if (sub === 'promote' || sub === 'demote') {
      const oldLevel = getUserStats(user.id, guildId).level;
      const newLevel = sub === 'promote'
        ? oldLevel + levels
        : Math.max(oldLevel - levels, 0);
      xpData[guildId][user.id].xp = newLevel ** 2 * 100;
      fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
      await addXp(user.id, guildId, 0, interaction.client);
      return interaction.reply({ content: `🔁 ${sub === 'promote' ? 'Promoted' : 'Demoted'} ${user.tag} to level ${newLevel}.`, ephemeral: true });
    }

    // /rank admin info
    if (sub === 'info') {
      const stats = getUserStats(user.id, guildId);
      const level = stats.level;
      const xp = stats.xp;
      const rankLevels = Object.keys(config.rankRoles || {}).map(Number).sort((a, b) => b - a);
      const matchedLevel = rankLevels.find(lvl => level >= lvl) || 0;
      const title = config.rankRoles?.[matchedLevel] || 'Unranked';

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const role = interaction.guild.roles.cache.find(r => r.name === title);
      const hasRole = member && role && member.roles.cache.has(role.id);

      return interaction.reply({
        content: `📋 Info for **${user.tag}**\n• XP: \`${xp}\`\n• Level: \`${level}\`\n• Title: **${title}**\n• Has Role: \`${hasRole ? 'Yes ✅' : 'No ❌'}\``,
        ephemeral: true
      });
    }
  }
};
