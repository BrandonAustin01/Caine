const config = require('../config/config.json');

function requireRankingEnabled(interaction) {
  if (!config.rankingSystem?.enabled) {
    interaction.reply({
      content: '📊 The ranking system is currently disabled on this server.',
      ephemeral: true
    });
    return false;
  }
  return true;
}

module.exports = requireRankingEnabled;
