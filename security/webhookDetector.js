const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");
const lockdown = require("../utils/lockdownState");

const config = require("../config/config.json").webhookMonitor;

const webhookCache = new Map();

module.exports = function detectWebhookAbuse(guildId, executorTag) {
  if (!config.enabled) return;

  const now = Date.now();

  if (!webhookCache.has(guildId)) {
    webhookCache.set(guildId, []);
  }

  const entries = webhookCache.get(guildId);
  entries.push(now);

  const recent = entries.filter((ts) => now - ts < config.intervalMs);
  webhookCache.set(guildId, recent);

  const alert = `🪝 Webhook created in ${guildId} by ${executorTag}`;
  logger.warn(alert);
  if (config.logToSecurity) securityLog.log(alert);
  if (config.alertOnTrigger) sendAlert(alert);

  if (recent.length >= config.maxWebhooks) {
    if (!lockdown.status()) {
      lockdown.enable();
      logger.error("🔒 Lockdown triggered due to webhook abuse.");
      securityLog.log("🔒 Lockdown triggered — webhook creation flood.");
      sendAlert(`🔒 **Cain Lockdown**: Excessive webhook creation detected.`);
    }

    webhookCache.set(guildId, []);
    setTimeout(() => webhookCache.delete(guildId), config.cooldownMs);
  }
};
