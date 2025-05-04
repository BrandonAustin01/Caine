const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");
const lockdown = require("../utils/lockdownState");

const config = require("../config/config.json").roleMonitor;

const escalationCache = new Map();

module.exports = function detectRoleEscalation(guildId, roleName, perms) {
  if (!config.enabled) return;

  const now = Date.now();
  if (!escalationCache.has(guildId)) {
    escalationCache.set(guildId, []);
  }

  const entries = escalationCache.get(guildId);
  entries.push(now);

  const recent = entries.filter(
    (ts) => now - ts < (config.intervalMs || 10000)
  );
  escalationCache.set(guildId, recent);

  const alert = `🚨 Role escalation: ${roleName} was updated with ${perms
    .map((p) => `\`${p}\``)
    .join(", ")}`;
  logger.warn(alert);
  if (config.logToSecurity) securityLog.log(alert);
  if (config.alertOnTrigger) sendAlert(alert);

  if (recent.length >= (config.maxEscalations || 3)) {
    if (!lockdown.status()) {
      lockdown.enable();
      logger.error(`🔒 Lockdown triggered due to multiple role escalations`);
      securityLog.log(`🔒 Lockdown triggered due to role escalation abuse`);
      sendAlert(
        `🔒 **Cain Lockdown**: Multiple role updates detected with dangerous permissions.`
      );
    }

    escalationCache.set(guildId, []);
    setTimeout(
      () => escalationCache.delete(guildId),
      config.cooldownMs || 60000
    );
  }
};
