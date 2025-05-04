let client = null;
const config = require("../config/config.json");
const { isRateLimited } = require("./rateLimiter"); // ✅ Add this

function registerClient(discordClient) {
  client = discordClient;
}

async function sendAlert(content) {
  try {
    if (!client || !config.alertChannelId) return;

    // ✅ Rate limit based on alert content key
    const rateKey = `alert:${content.slice(0, 30)}`; // use a hash or slice for uniqueness
    if (isRateLimited(rateKey, 5000)) return; // 5s cooldown for identical alerts

    const channel = await client.channels.fetch(config.alertChannelId);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(content);
  } catch (err) {
    console.error("⚠️ Failed to send alert:", err.message);
  }
}

module.exports = {
  registerClient,
  sendAlert,
};
