const fs = require('fs');
const path = require('path');
const xpPath = path.join(__dirname, '../data/xp.json');

let xpData = {};
try {
  const raw = fs.readFileSync(xpPath, 'utf8');
  xpData = raw ? JSON.parse(raw) : {};
} catch (err) {
  console.error('⚠️ Failed to load xp.json in levelSystem.js:', err);
  xpData = {};
}

let config = {};
try {
  config = require('../config/config.json');
} catch (err) {
  console.warn('⚠️ Could not load rank role config.');
}


// Level formula: basic square root scaling
function getLevelFromXp(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

function saveXpData() {
  fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2), 'utf8');
}

async function addXp(userId, guildId, amount = 10, client = null) {
  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) xpData[guildId][userId] = { xp: 0, level: 0 };

  const userData = xpData[guildId][userId];
  userData.xp += amount;

  const newLevel = getLevelFromXp(userData.xp);
  const previousLevel = userData.level;

  let rewardGranted = null;

  if (newLevel > previousLevel) {
    userData.level = newLevel;
    saveXpData();

    // If rankRoles exist and client was passed in
    if (client && config.rankRoles) {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId).catch(() => null);

      if (member) {
        const roleName = config.rankRoles[String(newLevel)];
        if (roleName) {
          const role = guild.roles.cache.find(r => r.name === roleName);
          if (role && !member.roles.cache.has(role.id)) {
            await member.roles.add(role).catch(() => {});
            rewardGranted = roleName;
          }
        }
      }
    }

    return { leveledUp: true, level: newLevel, reward: rewardGranted };
  }

  saveXpData();
  return { leveledUp: false };
}

function getUserStats(userId, guildId) {
  if (!xpData[guildId] || !xpData[guildId][userId]) return { xp: 0, level: 0 };
  return xpData[guildId][userId];
}

module.exports = {
  addXp,
  getUserStats,
  getLevelFromXp
};
