// utils/sendAlert.js (modLog section)

const { EmbedBuilder } = require("discord.js");
const config = require("../config/config.json");
const logger = require("./logger");

let clientRef = null;

/**
 * Register the Discord client for later use in logging.
 */
function registerClient(client) {
  clientRef = client;
}

/**
 * Post a moderation log entry to the configured mod log channel.
 * @param {string} action - The type of action (e.g., "Ban", "Kick", "Lockdown")
 * @param {string} userTag - The user's tag or a system label
 * @param {string} userId - The Discord user ID, or "0" for system
 * @param {string} reason - Reason for the action
 */
async function modLog(action, userTag, userId, reason = "No reason provided") {
  if (!clientRef) return;

  const channelId = config.modLogChannel;
  if (!channelId) return;

  const channel = await clientRef.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  // 🎨 Action-specific color theme
  const actionColors = {
    Ban: 0xe74c3c,
    Kick: 0xe67e22,
    Mute: 0xf1c40f,
    Warn: 0xffc107,
    Lockdown: 0x57606f,
  };
  const color = actionColors[action] || 0xff4757;

  const embed = new EmbedBuilder()
    .setTitle(`🛠️ Moderation Action: ${action}`)
    .addFields(
      { name: "User", value: `${userTag} (${userId})`, inline: false },
      { name: "Reason", value: reason, inline: false }
    )
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: "Logged by Caine Security Bot" });

  // 🖼️ Optional: Fetch avatar for display
  if (userId !== "0") {
    try {
      const user = await clientRef.users.fetch(userId);
      if (user) {
        embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
      }
    } catch (err) {
      logger.debug(`No avatar found for ${userTag}`);
    }
  }

  // ✅ Send the embed
  channel.send({ embeds: [embed] }).catch((err) => {
    logger.warn("⚠️ Failed to post to modLogChannel:", err);
  });
}

module.exports = {
  modLog,
  registerClient,
};
