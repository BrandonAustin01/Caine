const logger = require('../utils/logger');
const securityLog = require('../utils/securityLogger'); // ✅ Add this
const detectRaid = require('../security/raidDetector');
const config = require('../config/config.json').antiRaid;
const lockdown = require('../utils/lockdownState');

module.exports = async (client, member) => {
  try {
    logger.info(`📥 ${member.user.tag} joined ${member.guild.name}`);

    // 🔐 1. Lockdown check
    if (lockdown.status()) {
      await member.kick('Lockdown enabled — new joins disabled');
      logger.warn(`🔒 Kicked ${member.user.tag} — server is in lockdown`);
      securityLog.log(`🔒 Lockdown kick: ${member.user.tag} in ${member.guild.name}`);
      return;
    }

    // ⏳ 2. Account age check
    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    const accountAgeMinutes = Math.floor(accountAgeMs / (1000 * 60));

    if (accountAgeMinutes < config.minAccountAgeMinutes) {
      await member.kick('Anti-raid: account too new');
      logger.warn(`🚨 Kicked ${member.user.tag} — account too new (${accountAgeMinutes} min)`);
      securityLog.log(`🚨 Account too new: Kicked ${member.user.tag} (${accountAgeMinutes} min) from ${member.guild.name}`);
      return;
    }

    // 👥 3. Run raid detection logic
    await detectRaid(client, member);

  } catch (err) {
    logger.error(`⚠️ Error in guildMemberAdd handler:`, err);
    securityLog.log(`❌ Error handling join from ${member.user.tag}: ${err.message}`);
  }
};