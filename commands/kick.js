const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
  } = require('discord.js');
  
  const config = require('../config/config.json');
  const securityLog = require('../utils/securityLogger');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server.')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The member to kick')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for the kick')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
    async execute(interaction) {
      const target = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  
      if (!member) {
        return interaction.reply({
          content: `❌ Could not find ${target.tag} in this server.`,
          flags: 1 << 6
        });
      }
  
      if (!member.kickable) {
        return interaction.reply({
          content: `⚠️ I can't kick ${target.tag}. Check role hierarchy and permissions.`,
          flags: 1 << 6
        });
      }
  
      try {
        // ✅ Attempt DM
        await target.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('👢 You have been kicked')
              .setColor(0xffaa00)
              .setDescription(`You were kicked from **${interaction.guild.name}**.`)
              .addFields({ name: 'Reason', value: reason })
              .setTimestamp()
          ]
        }).catch(() => {});
  
        // ✅ Kick the user
        await member.kick(reason);
  
        const logEmbed = new EmbedBuilder()
          .setTitle('👢 Member Kicked')
          .setColor(0xffaa00)
          .addFields(
            { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
            { name: '📄 Reason', value: reason, inline: true },
            { name: '🔧 Moderator', value: interaction.user.tag, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Cain • Kick Log' });
  
        // ✅ Mod-log channel logging
        const logChannelId = config.modLogChannel;
        const modlog = logChannelId
          ? interaction.guild.channels.cache.get(logChannelId)
          : null;
  
        if (modlog && modlog.isTextBased()) {
          await modlog.send({ embeds: [logEmbed] });
        }
  
        // ✅ Internal logging
        securityLog.log(`👢 Kicked ${target.tag} (${target.id}) by ${interaction.user.tag} — Reason: ${reason}`);
  
        // ✅ Ephemeral response
        return interaction.reply({ embeds: [logEmbed], flags: 1 << 6 });
  
      } catch (err) {
        console.error(err);
        securityLog.log(`❌ Kick error for ${target.id}: ${err.message}`);
        return interaction.reply({
          content: '❌ An error occurred while trying to kick the user.',
          flags: 1 << 6
        });
      }
    }
};
  