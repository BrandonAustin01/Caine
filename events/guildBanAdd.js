const securityLog = require('../utils/securityLogger');
const logger = require('../utils/logger');

module.exports = async (client, ban) => {
  try {
    const { guild, user } = ban;

    // Fetch audit logs for the ban event
    const fetchedLogs = await guild.fetchAuditLogs({
      type: 'MEMBER_BAN_ADD',
      limit: 5
    });

    const logEntry = fetchedLogs.entries.find(entry =>
      entry.target.id === user.id &&
      Date.now() - entry.createdTimestamp < 5000
    );

    const moderator = logEntry?.executor?.tag || 'Unknown';
    const reason = logEntry?.reason || 'No reason provided';

    const message = `🔨 Ban recorded: ${user.tag} (${user.id}) was banned by ${moderator} — Reason: ${reason}`;
    logger.warn(message);
    securityLog.log(message);
  } catch (err) {
    logger.error('❌ Failed to log ban:', err);
    securityLog.log(`❌ Error in guildBanAdd: ${err.message}`);
  }
};
