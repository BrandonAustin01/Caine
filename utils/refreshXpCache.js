const path = require("path");

module.exports = function refreshXpCache(guildId) {
  const xpPath = path.join(__dirname, "../data/xp.json");
  delete require.cache[require.resolve(xpPath)];
  const fullData = require(xpPath);
  return fullData[guildId] || {};
};
