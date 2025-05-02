// commands/lockdown.js

const logger = require('../utils/logger');
const lockdown = require('../utils/lockdownState');
const securityLog = require('../utils/securityLogger');
const { isRateLimited } = require('../utils/rateLimiter');


module.exports = {
  name: 'lockdown',
  description: 'Toggle server lockdown mode (blocks all new joins)',
  async execute(message, args) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You must be an admin to use this command.');
    }

    const sub = args[0]?.toLowerCase();
    if (sub === 'on') {
        lockdown.enable();
        logger.warn(`🔒 Lockdown ENABLED by ${message.author.tag}`);
        securityLog.log(`🔒 Lockdown enabled by ${message.author.tag}`);
        return message.reply('🔒 Lockdown mode is now **ENABLED**. All new joins will be blocked.');
      }
      
      if (sub === 'off') {
        lockdown.disable();
        logger.info(`🔓 Lockdown DISABLED by ${message.author.tag}`);
        securityLog.log(`🔓 Lockdown disabled by ${message.author.tag}`);
        return message.reply('🔓 Lockdown mode is now **DISABLED**. New members can join normally.');
      }
  }
};
