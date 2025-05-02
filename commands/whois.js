// commands/whois.js

const {
  SlashCommandBuilder,
  EmbedBuilder,
  time,
  PermissionFlagsBits
} = require('discord.js');

const config = require('../config/config.json');
const securityLog = require('../utils/securityLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Fetch detailed info about a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to lookup')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    let member = null;
    let banned = false;

    try {
      member = await interaction.guild.members.fetch(user.id).catch(() => null);
    } catch {}

    try {
      const banInfo = await interaction.guild.bans.fetch(user.id).catch(() => null);
      banned = !!banInfo;
    } catch {}

    const isMuted = member?.roles.cache.some(r => r.name.toLowerCase().includes('muted')) || false;
    const highestRole = member?.roles.highest.name || 'N/A';

    const roles = member
      ? member.roles.cache
          .filter(r => r.id !== interaction.guild.id)
          .map(r => `<@&${r.id}>`)
          .slice(0, 15)
          .join(', ') || 'None'
      : 'Not in server';

    const perms = member?.permissions?.toArray().slice(0, 5).join(', ') || 'N/A';

    const embed = new EmbedBuilder()
      .setTitle(`👤 User Info: ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(banned ? 0xff3333 : isMuted ? 0xff8800 : 0x00cc99)
      .addFields(
        { name: '🆔 User ID', value: user.id, inline: true },
        { name: '🤖 Bot?', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Created', value: time(user.createdAt, 'F'), inline: true }
      )
      .setFooter({ text: banned ? '🚫 User is banned' : member ? '✅ User is in server' : '❓ Not in server' })
      .setTimestamp();

    if (member) {
      embed.addFields(
        { name: '📥 Joined Server', value: time(member.joinedAt, 'F'), inline: true },
        { name: '📡 Status', value: member.presence?.status || '⚫ Offline', inline: true },
        { name: `🏷️ Roles [${member.roles.cache.size - 1}]`, value: roles, inline: false },
        { name: '🔇 Muted?', value: isMuted ? 'Yes' : 'No', inline: true },
        { name: '🏛️ Highest Role', value: highestRole, inline: true },
        { name: '🔐 Top Permissions', value: perms, inline: false }
      );
    }

    // ✅ Send to mod-log channel if configured
    const modlogId = config.modLogChannel;
    const modlog = modlogId ? interaction.guild.channels.cache.get(modlogId) : null;

    if (modlog && modlog.isTextBased()) {
      await modlog.send({ embeds: [embed] });
    }

    // ✅ Internal security log
    securityLog.log(`📋 Whois lookup on ${user.tag} (${user.id}) by ${interaction.user.tag}`);

    return interaction.reply({ embeds: [embed], flags: 1 << 6 }); // ✅ Ephemeral to moderator
  }
};
