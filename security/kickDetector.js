const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const config = require("../config/config.json").antiKickAbuse;
const lockdown = require("../utils/lockdownState");
const sendAlert = require("../utils/sendAlert");

const kickCache = new Map();

/**
 * Detects repeated kick actions and optionally triggers auto-lockdown.
 * @param {Client} client - The Discord bot client.
 * @param {Guild} guild - The guild where the kick occurred.
 * @param {User} kickedUser - The user who got kicked.
 * @param {string} executorTag - The responsible user's tag.
 */
module.exports = function detectKickAbuse(
  client,
  guild,
  kickedUser,
  executorTag
) {
  if (!config.enabled) return;

  const guildId = guild.id;
  const now = Date.now();

  if (!kickCache.has(guildId)) {
    kickCache.set(guildId, []);
  }

  const recent = kickCache.get(guildId);
  recent.push(now);

  const valid = recent.filter((ts) => now - ts < config.intervalMs);
  kickCache.set(guildId, valid);

  if (valid.length >= config.maxKicks) {
    const summary = `⚠️ **Cain Alert**: ${valid.length} kicks detected in ${
      config.intervalMs / 1000
    }s in **${guild.name}**\nLast Executor: ${executorTag}`;

    logger.warn(summary);
    securityLog.log(summary);
    sendAlert(summary);

    // ✅ Trigger lockdown
    if (config.autoLockdown && !lockdown.status()) {
      lockdown.enable();
      logger.warn("🔒 Lockdown auto-enabled due to kick abuse detection.");
      securityLog.log("🔒 Lockdown auto-enabled by antiKickAbuse system.");
      modLog(
        "Lockdown",
        "System",
        "0",
        "Auto-lockdown triggered due to abuse detection"
      );
    }

    // 🔄 Reset + cooldown
    kickCache.set(guildId, []);
    setTimeout(() => kickCache.delete(guildId), config.cooldownMs);
  }
};
