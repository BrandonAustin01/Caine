// index.js

require("dotenv").config(); // Load environment variables

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
const path = require("path");
const fs = require("fs");

// Utilities
const versionPath = path.join(__dirname, "version.json");
const versionData = require(versionPath);
const logger = require("./utils/logger");
const { registerClient } = require("./utils/sendAlert");
const { registerClient: registerModLog } = require("./utils/modLogger");

// Create the client first (⚠️ this must come before using `client`)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Initialize slash commands map
client.commands = new Collection();

// Load slash commands from /commands/
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Load event files from /events/
const loadEvents = (dir) => {
  const files = fs.readdirSync(path.join(__dirname, dir));
  for (const file of files) {
    if (!file.endsWith(".js")) continue;

    const event = require(`./${dir}/${file}`);
    const eventName = file.split(".")[0];

    if (typeof event !== "function") {
      logger.warn(
        `⚠️ Skipped loading ${eventName}.js — not a valid function export.`
      );
      continue;
    }

    client.on(eventName, event.bind(null, client));
    logger.info(`✅ Loaded event: ${eventName}`);
  }
};

// On ready
client.once("ready", () => {
  versionData.started = Date.now();
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2), "utf8");
  logger.success(`🛡️ Cain is online as ${client.user.tag}`);
});

// Error handling
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

// Login
client
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.success("🔑 Login successful!");
    registerClient(client);
    registerModLog(client);
    loadEvents("events");
  })
  .catch((err) => {
    logger.error("❌ Login failed:", err);
    process.exit(1);
  });
