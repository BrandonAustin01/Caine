// events/guildMemberUpdate.js

const config = require("../config/config.json").roleMonitor;
const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");

const escalationCache = new Map();

module.exports = async (oldMember, newMember) => {
  if (!config.enabled) return;
  if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

  const addedRoles = newMember.roles.cache.filter(
    (role) => !oldMember.roles.cache.has(role.id)
  );
  if (addedRoles.size === 0) return;

  const guild = newMember.guild;
  const guildId = guild.id;
  const userId = newMember.id;
  const now = Date.now();

  // Track escalations
  if (!escalationCache.has(guildId)) escalationCache.set(guildId, []);
  const logs = escalationCache.get(guildId);
  logs.push(now);

  const recent = logs.filter((ts) => now - ts < config.intervalMs);
  escalationCache.set(guildId, recent);

  const roleNames = addedRoles.map((r) => r.name).join(", ");
  const tag = newMember.user.tag;

  const baseLog = `⚠️ Role escalation: ${tag} received [${roleNames}]`;

  logger.warn(baseLog);
  if (config.logToSecurity) securityLog.log(baseLog);
  if (config.alertOnTrigger) {
    sendAlert(
      `⚠️ **Cain Alert**: ${tag} received suspicious roles: [${roleNames}]`
    );
  }

  // ✅ Auto-remove added roles
  for (const [id, role] of addedRoles) {
    await newMember.roles.remove(role).catch(() => {});
  }

  // ✅ Find or auto-create "Warned" role
  let warnRole = guild.roles.cache.find(
    (r) => r.name.toLowerCase() === "warned"
  );
  if (!warnRole) {
    try {
      warnRole = await guild.roles.create({
        name: "Warned",
        color: 0xffc107,
        reason: "Auto-created by Caine — escalation detected",
      });
      logger.warn("⚠️ Auto-created missing 'Warned' role.");
      securityLog.log("🛠️ Created missing Warned role.");
    } catch (err) {
      logger.error("❌ Failed to create 'Warned' role:", err);
    }
  }

  // ✅ Apply the warned role if found/created
  if (warnRole && !newMember.roles.cache.has(warnRole.id)) {
    await newMember.roles.add(warnRole).catch(() => {});
  }

  // Final audit log
  securityLog.log(
    `🔐 Escalation handled: ${tag} — Removed [${roleNames}]${
      warnRole ? " & applied 'Warned'" : ""
    }`
  );

  // Cooldown
  if (recent.length >= config.maxEscalations) {
    escalationCache.set(guildId, []);
    setTimeout(() => escalationCache.delete(guildId), config.cooldownMs);
  }
};
