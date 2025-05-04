const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const config = require("../config/config.json").antiKickAbuse;
const lockdown = require("../utils/lockdownState"); // ✅ Import lockdown
const sendAlert = require("../utils/sendAlert");

const kickCache = new Map();

module.exports = function detectKickAbuse(guildId, kickedUser, executorTag) {
  if (!config.enabled) return;

  const now = Date.now();

  if (!kickCache.has(guildId)) {
    kickCache.set(guildId, []);
  }

  const recent = kickCache.get(guildId);
  recent.push(now);

  const valid = recent.filter((ts) => now - ts < config.intervalMs);
  kickCache.set(guildId, valid);

  if (valid.length >= config.maxKicks) {
    sendAlert(
      require("discord.js").client,
      `⚠️ Cain: ${valid.length} kicks detected in 10s in ${guildId}. Auto-lockdown triggered.`
    );
    const alert = `⚠️ ALERT: ${valid.length} kicks in ${
      config.intervalMs / 1000
    }s in guild ${guildId}. Last executor: ${executorTag}`;
    logger.error(alert);
    securityLog.log(alert);

    // ✅ Trigger lockdown if enabled
    if (config.autoLockdown && !lockdown.status()) {
      lockdown.enable();
      logger.warn("🔒 Lockdown auto-enabled due to kick abuse detection.");
      securityLog.log("🔒 Lockdown auto-enabled by antiKickAbuse system.");
    }

    // Reset and cooldown
    kickCache.set(guildId, []);
    setTimeout(() => kickCache.delete(guildId), config.cooldownMs);
  }
};
