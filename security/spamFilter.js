const config = require("../config/config.json").spamFilter;
const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const { sendAlert } = require("../utils/sendAlert");

const messageCache = new Map();

module.exports = async function spamFilter(message) {
  if (!config.enabled || message.author.bot) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();

  if (!messageCache.has(key)) {
    messageCache.set(key, []);
  }

  const userMessages = messageCache.get(key);
  userMessages.push(now);

  const recent = userMessages.filter((ts) => now - ts < config.intervalMs);
  messageCache.set(key, recent);

  // 🚨 Flood detection
  if (recent.length >= config.maxMessages) {
    const logMsg = `📣 Spam detected: ${message.author.tag} (${
      message.author.id
    }) in #${message.channel.name} — ${recent.length} messages in ${
      config.intervalMs / 1000
    }s`;

    logger.warn(logMsg);
    if (config.logToSecurity) securityLog.log(logMsg);
    sendAlert(
      `📣 **Cain Alert**: ${message.author.tag} is spamming in <#${message.channel.id}>`
    );

    try {
      if (config.punishment === "kick" && message.member.kickable) {
        await message.member.kick("Spamming - Auto moderation");
        logger.warn(`👢 Kicked ${message.author.tag} for spamming`);
        securityLog.log(`👢 Auto-kick: ${message.author.tag} for spamming`);
      } else if (config.punishment === "mute") {
        const muteRole = message.guild.roles.cache.find(
          (r) => r.name.toLowerCase() === "muted"
        );
        if (muteRole) {
          await message.member.roles.add(muteRole);
          logger.warn(`🔇 Muted ${message.author.tag} for spamming`);
          securityLog.log(`🔇 Auto-mute: ${message.author.tag} for spamming`);
        }
      }
    } catch (err) {
      logger.error(`❌ Failed to punish spammer: ${err.message}`);
    }

    messageCache.set(key, []); // reset after punishment
    return;
  }

  // 🚫 Mass Mention Detection
  const mentionCount =
    message.mentions.users.size +
    message.mentions.roles.size +
    (message.mentions.everyone || message.mentions.here ? 1 : 0);

  if (config.blockMassMentions && mentionCount >= (config.maxMentions || 5)) {
    const alert = `🚨 **Mass Mention Blocked** in <#${message.channel.id}> by ${message.author.tag}\nMentions: ${mentionCount}`;

    if (config.logToSecurity) {
      logger.warn(
        `[MassPing] ${message.author.tag} triggered mention protection.`
      );
      securityLog.log(alert);
      sendAlert(alert);
    }

    try {
      await message.delete().catch(() => {});
      await message.channel
        .send({
          content: `🚫 ${message.author}, mass mentions are not allowed.`,
        })
        .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
    } catch (err) {
      logger.error(`⚠️ Failed to handle mass mention: ${err.message}`);
    }

    return;
  }
};
