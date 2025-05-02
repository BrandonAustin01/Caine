const { EmbedBuilder, time, PermissionsBitField } = require('discord.js');
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  name: 'whois',
  description: 'Fetch detailed info about a user (by mention or ID).',
  async execute(message, args) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You must be an admin to use this command.');
    }

    const input = args[0];
    if (!input) return message.reply('Usage: `!whois <@user | userID>`');

    const userId = input.replace(/[<@!>]/g, '');
    let user, member, banned = false;

    try {
      user = await message.client.users.fetch(userId);
    } catch {
      return message.reply('❌ Could not fetch that user.');
    }

    try {
      member = await message.guild.members.fetch(user.id);
    } catch {
      member = null;
    }

    try {
      const banInfo = await message.guild.bans.fetch(user.id);
      banned = !!banInfo;
    } catch {
      banned = false;
    }

    const roles = member
      ? member.roles.cache
          .filter(r => r.id !== message.guild.id)
          .map(r => `<@&${r.id}>`)
          .slice(0, 15)
          .join(', ') || 'None'
      : 'Not in server';

    const isMuted = member?.roles.cache.some(r => r.name.toLowerCase().includes('muted')) || false;
    const highestRole = member?.roles.highest.name || 'N/A';

    // Permissions preview
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

    return message.reply({ embeds: [embed] });
  }
};
