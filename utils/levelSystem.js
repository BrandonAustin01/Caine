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

// 📈 Level formula: basic square root scaling
function getLevelFromXp(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

// 💾 Save XP data to disk
function saveXpData() {
  fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2), 'utf8');
}

// 🧠 Main XP add + levelup logic
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

    // 🎖️ Assign rank role if applicable
    if (client && config.rankRoles) {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId).catch(() => null);

      if (member) {
        const roleName = config.rankRoles[String(newLevel)];

        if (roleName) {
          let role = guild.roles.cache.find(r => r.name === roleName);

          // 🛠️ Auto-create role if missing and allowed
          if (!role && config.autoCreateRankRoles) {
            try {
              role = await guild.roles.create({
                name: roleName,
                color: 'Random',
                reason: `Auto-created by Cain for level ${newLevel}`
              });
              console.log(`🛠️ Created missing role: ${roleName}`);
            } catch (err) {
              console.warn(`⚠️ Failed to create role '${roleName}':`, err);
            }
          }

          // 🎁 Grant role if not already assigned
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

// 📊 Get a user's stats
function getUserStats(userId, guildId) {
  if (!xpData[guildId] || !xpData[guildId][userId]) return { xp: 0, level: 0 };
  return xpData[guildId][userId];
}

module.exports = {
  addXp,
  getUserStats,
  getLevelFromXp
};
