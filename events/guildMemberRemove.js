const securityLog = require('../utils/securityLogger');
const logger = require('../utils/logger');
const detectKickAbuse = require('../security/kickDetector');


module.exports = async (client, member) => {
  try {
    const { guild, user } = member;

    // Fetch recent kick entries
    const fetchedLogs = await guild.fetchAuditLogs({
      type: 'MEMBER_KICK',
      limit: 5
    });

    const logEntry = fetchedLogs.entries.find(entry =>
      entry.target.id === user.id &&
      Date.now() - entry.createdTimestamp < 5000
    );

    if (!logEntry) {
      logger.info(`👋 ${user.tag} left ${guild.name} (not a kick)`);
      return; // User left voluntarily
    }

    const moderator = logEntry.executor?.tag || 'Unknown';
    const reason = logEntry.reason || 'No reason provided';

    const message = `👢 Kick recorded: ${user.tag} (${user.id}) was kicked by ${moderator} — Reason: ${reason}`;
    logger.warn(message);
    securityLog.log(message);

    // Detect abuse
    detectKickAbuse(guild.id, user, moderator);
  } catch (err) {
    logger.error('❌ Failed to check kick logs:', err);
    securityLog.log(`❌ Error in guildMemberRemove: ${err.message}`);
  }
};
