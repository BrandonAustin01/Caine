const { Events } = require("discord.js");
const config = require("../config/config.json").webhookMonitor;
const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");
const detectWebhookAbuse = require("../security/webhookDetector"); // ✅ Patch-in

module.exports = {
  name: Events.WebhookCreate,
  async execute(webhook) {
    if (!config.enabled) return;

    const guild = webhook.guild;
    const channel = webhook.channel;
    const creatorId = webhook.owner?.id || "Unknown";
    const creatorTag = webhook.owner?.tag || "Unknown";

    const msg = `🪝 Webhook created in #${channel.name} by ${creatorTag} (${creatorId})`;

    // 🧩 Trigger abuse tracking
    detectWebhookAbuse(guild.id, creatorTag);

    // 🛡️ Security logging
    if (config.logToSecurity) {
      securityLog.log(msg);
    }
    logger.warn(msg);

    // 🧾 Optional auto-delete for untrusted users
    const isWhitelisted = config.whitelistUsers?.includes(creatorId);
    if (config.autoDelete && !isWhitelisted) {
      try {
        await webhook.delete(
          "Unauthorized webhook creation (Caine Auto-Delete)"
        );
        logger.warn(`❌ Deleted unauthorized webhook in #${channel.name}`);
        securityLog.log(`❌ Auto-deleted webhook created by ${creatorTag}`);
      } catch (err) {
        logger.error("❌ Failed to delete webhook:", err);
        securityLog.log(`❌ Error auto-deleting webhook: ${err.message}`);
      }
    }

    // 🔔 Optional alert
    if (config.alertOnTrigger) {
      sendAlert(
        `🪝 **Cain Alert**: Webhook created in <#${channel.id}> by **${creatorTag}** (${creatorId})`
      );
    }
  },
};
