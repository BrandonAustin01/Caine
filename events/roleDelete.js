// events/roleDelete.js

const config = require("../config/config.json").roleDeleteMonitor;
const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");
const lockdown = require("../utils/lockdownState");
const { AuditLogEvent } = require("discord.js");

module.exports = async function (role) {
  if (!config.enabled) return;

  const { name, guild } = role;
  const guildName = guild.name;

  if (!config.protectedRoles.includes(name)) return;

  const msg = `🛑 Protected role deleted: **${name}** in ${guildName}`;
  logger.warn(msg);
  if (config.logToSecurity) securityLog.log(msg);
  if (config.alertOnTrigger) {
    sendAlert(
      `🛑 **Cain Alert**: Protected role **${name}** was deleted in **${guildName}**`
    );
  }

  // 🛠️ Recreate if allowed
  if (config.autoRecreate) {
    try {
      await guild.roles.create({
        name,
        color: config.recreateColor || "#ff0000",
        reason: "Recreating protected role deleted unexpectedly",
      });
      logger.warn(`🛠️ Recreated protected role: ${name}`);
      securityLog.log(`🛠️ Auto-recreated role: ${name}`);
    } catch (err) {
      logger.error(`❌ Failed to recreate role ${name}:`, err);
      securityLog.log(`❌ Failed to recreate protected role: ${err.message}`);
    }
  }

  // 🔍 Fetch audit log for the deleter
  try {
    const logs = await guild.fetchAuditLogs({
      type: AuditLogEvent.RoleDelete,
      limit: 1,
    });

    const entry = logs.entries.first();
    const executor = entry?.executor;
    const tag = executor?.tag || "Unknown";

    if (executor && role.id === entry.target.id) {
      const punishment = config.punishment?.toLowerCase();

      if (
        punishment === "kick" &&
        guild.members.me.permissions.has("KickMembers")
      ) {
        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (member?.kickable) {
          await member.kick("Deleted protected role");
          logger.warn(`👢 Kicked ${tag} for deleting protected role`);
          securityLog.log(`👢 Auto-kicked ${tag} for role deletion`);
        }
      } else if (
        punishment === "ban" &&
        guild.members.me.permissions.has("BanMembers")
      ) {
        const member = await guild.members.fetch(executor.id).catch(() => null);
        if (member?.bannable) {
          await member.ban({ reason: "Deleted protected role" });
          logger.warn(`🔨 Banned ${tag} for deleting protected role`);
          securityLog.log(`🔨 Auto-banned ${tag} for role deletion`);
        }
      }
    }
  } catch (err) {
    logger.error("❌ Failed to fetch audit logs for roleDelete:", err);
    securityLog.log(`❌ Audit fetch failed: ${err.message}`);
  }

  // 🔒 Optional lockdown
  if (config.autoLockdown && !lockdown.status()) {
    lockdown.enable();
    logger.error("🔒 Lockdown triggered: Protected role deleted.");
    securityLog.log("🔒 Lockdown enabled due to protected role deletion.");
    sendAlert(`🔒 **Cain Lockdown**: Protected role **${name}** was deleted.`);
    modLog(
      "Lockdown",
      "System",
      "0",
      `Triggered by deletion of protected role: ${name}`
    );
  }
};
