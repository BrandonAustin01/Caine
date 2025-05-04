const { AuditLogEvent } = require("discord.js");
const detectWebhookAbuse = require("../security/webhookDetector");
const logger = require("../utils/logger");

module.exports = async (client, channel) => {
  try {
    const fetched = await channel.guild.fetchAuditLogs({
      type: AuditLogEvent.WebhookCreate,
      limit: 1,
    });

    const entry = fetched.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;

    const executorTag = entry.executor?.tag || "Unknown";

    logger.warn(
      `🪝 Webhook created in ${channel.guild.name} by ${executorTag}`
    );

    detectWebhookAbuse(channel.guild.id, executorTag);
  } catch (err) {
    logger.error("❌ Failed to inspect webhook update:", err);
  }
};
