const { EmbedBuilder } = require('discord.js');
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  name: 'baninfo',
  description: 'Show ban reason and details for a user by ID or mention.',
  async execute(message, args) {
    if (!message.member.permissions.has('BanMembers')) {
      return message.reply('❌ You must have Ban Members permission to use this.');
    }

    const input = args[0];
    if (!input) {
      return message.reply('Usage: `!baninfo <@user | userID>`');
    }

    const userId = input.replace(/[<@!>]/g, '');

    if (isRateLimited(message.author.id, 5000)) {
        return message.reply('⏳ Slow down! Try again in a few seconds.');
      }

    try {
      const ban = await message.guild.bans.fetch(userId);

      const embed = new EmbedBuilder()
        .setTitle(`🚫 Ban Info: ${ban.user.tag}`)
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setColor(0xff5555)
        .addFields(
          { name: 'User ID', value: ban.user.id, inline: true },
          { name: 'Reason', value: ban.reason || 'No reason provided', inline: false },
          { name: 'Banned By', value: '⚠️ Not available via Discord API', inline: false }
        )
        .setFooter({ text: 'Note: Discord does not expose ban timestamps or executor via the API.' });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      return message.reply(`❌ No ban found for \`${userId}\`, or the user was never banned.`);
    }
  }
};
