const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const spamFilter = require('../security/spamFilter');
const { addXp } = require('../utils/levelSystem');

const cooldown = new Set();
const commands = new Map();

// Load all message-based (!command) handlers
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  if (command.name) {
    commands.set(command.name, command);
  }
}

module.exports = async (client, message) => {
  if (message.author.bot || !message.guild) return;

  // ✅ XP system with level-up + role reward
  const key = `${message.guild.id}-${message.author.id}`;
  if (!cooldown.has(key) && message.content.length >= 5) {
    const result = await addXp(message.author.id, message.guild.id, 15, client);

    if (result.leveledUp) {
      message.channel.send(`🎉 ${message.author} reached **level ${result.level}**!`).catch(() => {});
      if (result.reward) {
        message.channel.send(`🏅 Awarded role: **${result.reward}**`).catch(() => {});
      }
    }

    cooldown.add(key);
    setTimeout(() => cooldown.delete(key), 60_000); // 1 min cooldown
  }

  // ✅ Run spam filter
  await spamFilter(message);

  // ✅ Only process prefixed commands (!)
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    logger.error(`❌ Error running command '${cmdName}':`, err);
    message.reply('⚠️ There was an error executing that command.').catch(() => {});
  }
};
