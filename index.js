// index.js

// Load environment variables from .env file
require('dotenv').config();

// Import the discord.js Client
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const path = require('path');
const fs = require('fs');
const versionPath = path.join(__dirname, 'version.json');
const versionData = require(versionPath);
const { registerClient } = require('./utils/sendAlert');


// Import logger utility
const logger = require('./utils/logger');

// Create a new Discord client with the necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                // Basic guild data
    GatewayIntentBits.GuildMembers,          // Join/leave events
    GatewayIntentBits.GuildMessages,         // Message events
    GatewayIntentBits.MessageContent         // To read message text
  ],
  partials: [Partials.Channel]
});

// Event loader
const loadEvents = (dir) => {
    const files = fs.readdirSync(path.join(__dirname, dir));
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const event = require(`./${dir}/${file}`);
      const eventName = file.split('.')[0];
  
      // Check if the event is a valid function
      if (typeof event !== 'function') {
        logger.warn(`⚠️ Skipped loading ${eventName}.js — not a valid function export.`);
        continue;
      }
  
      client.on(eventName, event.bind(null, client));
      logger.info(`✅ Loaded event: ${eventName}`);
    }
  };
// Handle client ready
client.once('ready', () => {
  versionData.started = Date.now();
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2), 'utf8');

  logger.success(`🛡️ Cain is online as ${client.user.tag}`);
});

// Global error handlers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

// Login
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.success('🔑 Login successful!');
    registerClient(client);
    loadEvents('events');
  })
  .catch((err) => {
    logger.error('❌ Login failed:', err);
    process.exit(1);
  });
