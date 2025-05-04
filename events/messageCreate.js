const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const spamFilter = require("../security/spamFilter");
const { addXp } = require("../utils/levelSystem");
const config = require("../config/config.json");

const cooldown = new Set();
const commands = new Map();

// 🔄 Load all message-based (!command) handlers
const commandFiles = fs.readdirSync(path.join(__dirname, "../commands"));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  if (command.name) {
    commands.set(command.name, command);
  }
}

module.exports = async (client, message) => {
  if (message.author.bot || !message.guild) return;

  // ✅ Optional XP system with cooldown and randomness
  if (config.rankingSystem?.enabled) {
    const key = `${message.guild.id}-${message.author.id}`;

    if (!cooldown.has(key) && message.content.length >= 5) {
      // 🔢 Grant random XP between 10–17
      const xp = Math.floor(Math.random() * 8) + 10;
      const result = await addXp(
        message.author.id,
        message.guild.id,
        xp,
        client
      );

      // 🎉 If leveled up, announce it
      if (result.leveledUp) {
        message.channel
          .send(`🎉 ${message.author} reached **level ${result.level}**!`)
          .catch(() => {});
        if (result.reward) {
          message.channel
            .send(`🏅 Awarded role: **${result.reward}**`)
            .catch(() => {});
        }
      }

      // ⏳ Add to cooldown set for 1 minute
      cooldown.add(key);
      setTimeout(() => cooldown.delete(key), 60_000);
    }
  }

  // 🛡️ Run spam filter logic
  await spamFilter(message);

  // ⚠️ Only respond to message-based commands (!command)
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const command = commands.get(cmdName);
  if (!command) return;

  // 🧠 Execute the command
  try {
    await command.execute(message, args);
  } catch (err) {
    logger.error(`❌ Error running command '${cmdName}':`, err);
    message
      .reply("⚠️ There was an error executing that command.")
      .catch(() => {});
  }
};
