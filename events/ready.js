module.exports = (client) => {
  const totalGuilds = client.guilds.cache.size;
  const totalUsers = client.users.cache.size;

  // Log a friendly message using our logger
  const logger = require("../utils/logger");
  logger.success(
    `🤖 Ready! Connected to ${totalGuilds} server(s) and ${totalUsers} user(s).`
  );
};
