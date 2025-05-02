const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
  } = require('discord.js');
  
  const config = require('../config/config.json');
  const securityLog = require('../utils/securityLogger');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user by ID')
      .addStringOption(option =>
        option.setName('userid')
          .setDescription('The ID of the user to unban')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for unbanning the user')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
    async execute(interaction) {
      const userId = interaction.options.getString('userid');
      const reason = interaction.options.getString('reason') || 'No reason provided';
  
      try {
        const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
  
        if (!ban) {
          return interaction.reply({
            content: `⚠️ No active ban found for \`${userId}\`.`,
            ephemeral: true
          });
        }
  
        await interaction.guild.members.unban(userId, reason);
  
        const logEmbed = new EmbedBuilder()
          .setTitle('✅ User Unbanned')
          .setColor(0x4caf50)
          .addFields(
            { name: '👤 User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
            { name: '📄 Reason', value: reason, inline: true },
            { name: '🔧 Moderator', value: interaction.user.tag, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Cain • Unban Log' });
  
        // ✅ DM the user (silently fail if blocked)
        try {
          await ban.user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('🔓 You have been unbanned')
                .setColor(0x4caf50)
                .setDescription(`You’ve been unbanned from **${interaction.guild.name}**.`)
                .addFields({ name: 'Reason', value: reason })
                .setTimestamp()
            ]
          });
        } catch {
          // User has DMs closed or blocked the bot — silently ignore
        }
  
        // ✅ Send to mod-log channel (if set)
        const modlogChannelId = config.modLogChannel;
        const modlogChannel = modlogChannelId
          ? interaction.guild.channels.cache.get(modlogChannelId)
          : null;
  
        if (modlogChannel && modlogChannel.isTextBased()) {
          await modlogChannel.send({ embeds: [logEmbed] });
        }
  
        // ✅ Internal audit log
        securityLog.log(`🟢 Unbanned user ${ban.user.tag} (${ban.user.id}) by ${interaction.user.tag} — Reason: ${reason}`);
  
        // ✅ Ephemeral response to moderator
        return interaction.reply({ embeds: [logEmbed], flags: 1 << 6 });
  
      } catch (err) {
        console.error(err);
        securityLog.log(`❌ Unban error for ID ${userId}: ${err.message}`);
        return interaction.reply({
          content: '❌ An error occurred while trying to unban the user.',
          flags: 1 << 6
        });
      }
    }
  };
  