// commands/unmute.js

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
  } = require('discord.js');
  
  const config = require('../config/config.json');
  const securityLog = require('../utils/securityLogger');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Unmute a user (removes timeout and/or Muted role).')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The member to unmute')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
    async execute(interaction) {
      const target = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  
      if (!member) {
        return interaction.reply({ content: '❌ Could not find that user in the server.', flags: 1 << 6 });
      }
  
      const hasTimeout = member.communicationDisabledUntilTimestamp > Date.now();
      const mutedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      const hasMutedRole = mutedRole && member.roles.cache.has(mutedRole.id);
  
      if (!hasTimeout && !hasMutedRole) {
        return interaction.reply({ content: '⚠️ That user is not muted.', flags: 1 << 6 });
      }
  
      try {
        // Remove timeout if active
        if (hasTimeout) {
          await member.timeout(null);
        }
  
        // Remove role-based mute if present
        if (hasMutedRole) {
          await member.roles.remove(mutedRole);
        }
  
        // DM user
        await target.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('🔊 You have been unmuted')
              .setDescription(`You have been unmuted in **${interaction.guild.name}**.`)
              .setColor(0x00cc66)
              .setTimestamp()
          ]
        }).catch(() => {});
  
        const embed = new EmbedBuilder()
          .setTitle('🔊 Member Unmuted')
          .setColor(0x00cc66)
          .addFields(
            { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
            { name: '🔧 Moderator', value: interaction.user.tag }
          )
          .setTimestamp()
          .setFooter({ text: 'Cain • Unmute Log' });
  
        const modlog = config.modLogChannel
          ? interaction.guild.channels.cache.get(config.modLogChannel)
          : null;
  
        if (modlog && modlog.isTextBased()) {
          await modlog.send({ embeds: [embed] });
        }
  
        securityLog.log(`🔊 Unmuted ${target.tag} by ${interaction.user.tag}`);
  
        return interaction.reply({ embeds: [embed], flags: 1 << 6 });
  
      } catch (err) {
        console.error(err);
        securityLog.log(`❌ Failed to unmute ${target.tag}: ${err.message}`);
        return interaction.reply({ content: '❌ Failed to unmute the user.', flags: 1 << 6 });
      }
    }
  };
  