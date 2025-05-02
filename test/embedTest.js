const {
    buildAntiRaidEmbed,
    buildSpamFilterEmbed,
    buildRankingEmbed
  } = require('../utils/buildConfigEmbed');
  
  const { EmbedBuilder } = require('discord.js');
  const { inspect } = require('util');
  
  // 🧪 Fake config to simulate a live environment
  const mockConfig = {
    antiRaid: {
      enabled: true,
      maxJoins: 5,
      intervalMs: 10000,
      punishment: 'kick',
      cooldownMs: 60000
    },
    spamFilter: {
      enabled: false,
      maxMessages: 8,
      intervalMs: 5000,
      punishment: 'mute',
      cooldownMs: 45000
    },
    rankingSystem: {
      enabled: true
    },
    rankRoles: {
      "5": "Rookie",
      "10": "Member",
      "20": "Veteran"
    }
  };
  
  // 🔍 Run each builder and log output
  console.log('\n🔧 Anti-Raid Embed Preview:\n', inspect(buildAntiRaidEmbed(mockConfig.antiRaid).toJSON(), { depth: 5 }));
  
  console.log('\n🧹 Spam Filter Embed Preview:\n', inspect(buildSpamFilterEmbed(mockConfig.spamFilter).toJSON(), { depth: 5 }));
  
  console.log('\n🏅 Ranking System Embed Preview:\n', inspect(buildRankingEmbed(mockConfig.rankingSystem, mockConfig.rankRoles).toJSON(), { depth: 5 }));
  