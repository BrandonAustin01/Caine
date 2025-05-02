// events/messageCreate.js

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const spamFilter = require('../security/spamFilter');

// Load all commands into a map
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'));

for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  if (command.name) {
    commands.set(command.name, command);
  }
}

module.exports = async (client, message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  await spamFilter(message);

  const args = message.content.slice(1).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    logger.error(`❌ Error running command '${cmdName}':`, err);
    message.reply('⚠️ There was an error executing that command.');
  }
};
