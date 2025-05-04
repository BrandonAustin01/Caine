const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");
const config = require("../config/config.json").roleMonitor;
const detectRoleEscalation = require("../security/roleEscalationDetector");

module.exports = async (client, oldRole, newRole) => {
  if (!config?.enabled) return;

  // Define permissions we care about
  const sensitivePerms = [
    "Administrator",
    "ManageRoles",
    "ManageWebhooks",
    "BanMembers",
    "KickMembers",
    "ManageGuild",
  ];

  const grantedPerms = sensitivePerms.filter(
    (perm) => !oldRole.permissions.has(perm) && newRole.permissions.has(perm)
  );

  if (grantedPerms.length === 0) return;

  const alert = `🔐 **Security Alert**: Role **${newRole.name}** in **${
    newRole.guild.name
  }** was updated with new sensitive permission(s): ${grantedPerms
    .map((p) => `\`${p}\``)
    .join(", ")}`;

  logger.warn(alert);
  if (config.logToSecurity) securityLog.log(alert);
  if (config.alertOnTrigger) sendAlert(alert);

  detectRoleEscalation(newRole.guild.id, newRole.name, grantedPerms);
};
