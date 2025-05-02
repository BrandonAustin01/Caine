const fs = require('fs');
const path = require('path');
const securityLogPath = path.join(__dirname, '../logs/security.log');
const { isRateLimited } = require('../utils/rateLimiter');

module.exports = {
  name: 'securitylog',
  description: 'View or clear the security log.',
  async execute(message, args) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You must be an admin to use this command.');
    }

    const sub = args[0]?.toLowerCase();

    // Show last X entries
    if (sub === 'last') {
      const count = parseInt(args[1]) || 10;

      try {
        const data = fs.readFileSync(securityLogPath, 'utf8');
        const lines = data.trim().split('\n');
        const lastLines = lines.slice(-count);

        if (lastLines.length === 0) {
          return message.reply('🔍 Security log is currently empty.');
        }

        const formatted = lastLines.map(line => `• ${line}`).join('\n');

        await message.reply(`🛡️ Last ${lastLines.length} security events:\n\`\`\`\n${formatted}\n\`\`\``);
      } catch (err) {
        console.error(err);
        return message.reply('⚠️ Failed to read the security log.');
      }
    }

    // Clear log (with confirmation)
    else if (sub === 'clear') {
      try {
        fs.writeFileSync(securityLogPath, '', 'utf8');
        return message.reply('🧹 Security log has been cleared.');
      } catch (err) {
        console.error(err);
        return message.reply('❌ Failed to clear the security log.');
      }
    }

    else {
      return message.reply('Usage:\n• `!securitylog last [count]`\n• `!securitylog clear`');
    }
  }
};
