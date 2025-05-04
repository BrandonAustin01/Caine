// security/botJoinDetector.js

const config = require("../config/config.json").antiBotJoins;
const logger = require("../utils/logger");
const securityLog = require("../utils/securityLogger");
const sendAlert = require("../utils/sendAlert");

/**
 * Detect and respond to unauthorized bot joins.
 * @param {Client} client - The Discord client instance
 * @param {GuildMember} member - The member who just joined
 */
module.exports = async function checkBotJoin(client, member) {
  if (!config.enabled || !member.user.bot) return;

  const botId = member.user.id;
  const guildName = member.guild.name;

  if (!config.allowlist.includes(botId)) {
    const action = config.punishment;
    const tag = member.user.tag;

    const msg = `🤖 Unauthorized bot joined: ${tag} (${botId}) in ${guildName}`;

    logger.warn(msg);
    securityLog.log(`⚠️ ${msg}`);
    sendAlert(
      `⚠️ **Cain Alert**: Unauthorized bot \`${tag}\` joined **${guildName}**`
    );

    try {
      if (action === "kick" && member.kickable) {
        await member.kick("Unauthorized bot (antiBotJoins)");
        logger.warn(`👢 Kicked bot ${tag}`);
        securityLog.log(`👢 Auto-kick: Bot ${tag} in ${guildName}`);
      } else if (action === "ban") {
        await member.ban({ reason: "Unauthorized bot (antiBotJoins)" });
        logger.warn(`🔨 Banned bot ${tag}`);
        securityLog.log(`🔨 Auto-ban: Bot ${tag} in ${guildName}`);
      }
    } catch (err) {
      logger.error(`❌ Failed to ${action} bot ${tag}:`, err);
      securityLog.log(`❌ Bot punishment failed for ${tag}: ${err.message}`);
    }
  }
};
