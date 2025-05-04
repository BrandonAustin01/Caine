const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const detectRaid = require("../security/raidDetector");
const checkBotJoin = require("../security/botJoinDetector"); // ✅ New import
const config = require("../config/config.json").antiRaid;
const lockdown = require("../utils/lockdownState");

module.exports = async (client, member) => {
  try {
    logger.info(`📥 ${member.user.tag} joined ${member.guild.name}`);

    // ✅ 1. Check for unauthorized bot joins
    await checkBotJoin(client, member);

    // 🔒 2. Lockdown enforcement
    if (lockdown.status()) {
      await member.kick("Lockdown enabled — new joins disabled");
      logger.warn(`🔒 Kicked ${member.user.tag} — server is in lockdown`);
      securityLog.log(
        `🔒 Lockdown kick: ${member.user.tag} in ${member.guild.name}`
      );
      return;
    }

    // ⏳ 3. Minimum account age check
    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    const accountAgeMinutes = Math.floor(accountAgeMs / (1000 * 60));

    if (accountAgeMinutes < config.minAccountAgeMinutes) {
      await member.kick("Anti-raid: account too new");
      logger.warn(
        `🚨 Kicked ${member.user.tag} — account too new (${accountAgeMinutes} min)`
      );
      securityLog.log(
        `🚨 Account too new: Kicked ${member.user.tag} (${accountAgeMinutes} min) from ${member.guild.name}`
      );
      return;
    }

    // 👥 4. Run raid detection
    await detectRaid(client, member);
  } catch (err) {
    logger.error(`⚠️ Error in guildMemberAdd handler:`, err);
    securityLog.log(
      `❌ Error handling join from ${member.user.tag}: ${err.message}`
    );
  }
};
