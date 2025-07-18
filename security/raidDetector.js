const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger"); // ✅ Added
const config = require("../config/config.json").antiRaid;
const sendAlert = require("../utils/sendAlert");

const joinCache = new Map();

module.exports = async function detectRaid(client, member) {
  if (!config.enabled) return;

  const guildId = member.guild.id;
  const now = Date.now();

  if (!joinCache.has(guildId)) {
    joinCache.set(guildId, []);
  }

  const recentJoins = joinCache.get(guildId);
  recentJoins.push(now);

  const validJoins = recentJoins.filter((ts) => now - ts < config.intervalMs);
  joinCache.set(guildId, validJoins);

  logger.info(
    `👥 ${validJoins.length} join(s) in ${member.guild.name} within ${
      config.intervalMs / 1000
    }s`
  );

  if (validJoins.length >= config.maxJoins) {
    const alert = `🚨 **Cain Alert**: Raid detected in **${
      member.guild.name
    }**.\n• Joins: ${validJoins.length} in ${
      config.intervalMs / 1000
    }s\n• Punishment: ${config.punishment.toUpperCase()}`;
    sendAlert(alert);

    logger.warn(
      `🚨 Possible raid detected in ${member.guild.name} — taking action`
    );
    securityLog.log(
      `🚨 Raid triggered in ${member.guild.name} — ${validJoins.length} joins`
    );

    joinCache.set(guildId, []);
    setTimeout(() => joinCache.delete(guildId), config.cooldownMs);

    try {
      const guildMembers = await member.guild.members.fetch();
      const newMembers = guildMembers.filter(
        (m) => now - m.joinedTimestamp < config.intervalMs
      );

      for (const [id, m] of newMembers) {
        if (!m.kickable) continue;

        if (config.punishment === "kick") {
          await m.kick("Anti-raid system");
          modLog("Kick", member.user.tag, member.user.id, "Anti-raid system");
          logger.warn(`👢 Kicked ${m.user.tag} (raid detected)`);
          securityLog.log(
            `👢 Raid kick: ${m.user.tag} in ${member.guild.name}`
          );
        } else if (config.punishment === "ban") {
          await m.ban({ reason: "Anti-raid system" });
          modLog("Ban", member.user.tag, member.user.id, "Anti-raid system");
          logger.warn(`🔨 Banned ${m.user.tag} (raid detected)`);
          securityLog.log(`🔨 Raid ban: ${m.user.tag} in ${member.guild.name}`);
        }
      }
    } catch (err) {
      logger.error("⚠️ Error while handling raid punishment:", err);
      securityLog.log(`❌ Raid punishment failed: ${err.message}`);
    }
  }
};
