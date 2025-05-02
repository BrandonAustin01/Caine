const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/config.json');
let config = require(configPath);
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  name: 'setalertchannel',
  description: 'Set the channel Cain should use for security alerts.',
  async execute(message) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You must be an admin to use this command.');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('Usage: `!setalertchannel #channel`');
    }

    config.alertChannelId = channel.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    return message.reply(`✅ Cain will now send security alerts to <#${channel.id}>.`);
  }
};
