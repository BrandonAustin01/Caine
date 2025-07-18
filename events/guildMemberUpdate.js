const fs = require("fs");
const path = require("path");
const config = require("../config/config.json").roleMonitor;
const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");

const escalationCache = new Map();
const logsDir = path.join(__dirname, "../logs");
const auditPath = path.join(logsDir, "audit.json");

function appendAuditLog(entry) {
  try {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    const logs = fs.existsSync(auditPath)
      ? JSON.parse(fs.readFileSync(auditPath, "utf8"))
      : [];
    logs.push({ timestamp: Date.now(), ...entry });
    fs.writeFileSync(auditPath, JSON.stringify(logs, null, 2));
  } catch (err) {
    logger.error("❌ Failed to write to audit.json:", err);
  }
}

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

  if (!escalationCache.has(guildId)) escalationCache.set(guildId, []);
  const logs = escalationCache.get(guildId);
  logs.push(now);

  const recent = logs.filter((ts) => now - ts < config.intervalMs);
  escalationCache.set(guildId, recent);

  const roleNames = addedRoles.map((r) => r.name).join(", ");
  modLog(
    "Role Removal",
    newMember.user.tag,
    newMember.user.id,
    `Removed roles: ${roleNames}`
  );

  const tag = newMember.user.tag;

  const baseLog = `⚠️ Role escalation: ${tag} received [${roleNames}]`;

  logger.warn(baseLog);
  if (config.logToSecurity) securityLog.log(baseLog);
  if (config.alertOnTrigger) {
    sendAlert(
      `⚠️ **Cain Alert**: ${tag} received suspicious roles: [${roleNames}]`
    );
  }

  for (const [id, role] of addedRoles) {
    await newMember.roles.remove(role).catch(() => {});
  }

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

  if (warnRole && !newMember.roles.cache.has(warnRole.id)) {
    await newMember.roles.add(warnRole).catch(() => {});
  }

  // ✅ Persistent audit logging
  appendAuditLog({
    userId,
    tag,
    addedRoles: roleNames,
    guild: guild.name,
    warned: !!warnRole,
  });

  securityLog.log(
    `🔐 Escalation handled: ${tag} — Removed [${roleNames}]${
      warnRole ? " & applied 'Warned'" : ""
    }`
  );

  if (recent.length >= config.maxEscalations) {
    escalationCache.set(guildId, []);
    setTimeout(() => escalationCache.delete(guildId), config.cooldownMs);
  }
};
