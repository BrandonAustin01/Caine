const fs = require("fs");
const path = require("path");
const xpPath = path.join(__dirname, "../data/xp.json");

// 🧠 In-memory XP cache
let xpData = {};
try {
  const raw = fs.readFileSync(xpPath, "utf8");
  xpData = raw ? JSON.parse(raw) : {};
} catch (err) {
  console.error("⚠️ Failed to load xp.json in levelSystem.js:", err);
  xpData = {};
}

// 🔧 Config cache
let config = {};
try {
  config = require("../config/config.json");
} catch (err) {
  console.warn("⚠️ Could not load rank role config.");
}

// 📈 Square root XP level formula
function getLevelFromXp(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

// 🔢 Get XP required for a given level
function getXpForLevel(level) {
  return Math.floor((level / 0.1) ** 2);
}

// 🔁 Save XP to disk
function saveXpData() {
  fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2), "utf8");
}

// 🔄 Force reload from disk (used by /leaderboard etc)
function refreshXpCache(guildId = null) {
  try {
    const raw = fs.readFileSync(xpPath, "utf8");
    xpData = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("⚠️ Failed to reload xp.json:", err);
    xpData = {};
  }

  return guildId ? xpData[guildId] || {} : xpData;
}

// ➕ Add XP and check for level-up
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

    // 🏅 Grant rank role
    if (client && config.rankRoles) {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        const roleName = config.rankRoles[String(newLevel)];
        if (roleName) {
          let role = guild.roles.cache.find((r) => r.name === roleName);

          if (!role && config.autoCreateRankRoles) {
            try {
              role = await guild.roles.create({
                name: roleName,
                color: "Random",
                reason: `Auto-created by Caine for level ${newLevel}`,
              });
              console.log(`🛠️ Created missing role: ${roleName}`);
            } catch (err) {
              console.warn(`⚠️ Failed to create role '${roleName}':`, err);
            }
          }

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

// 📊 Return a user's XP + level
function getUserStats(userId, guildId) {
  if (!xpData[guildId] || !xpData[guildId][userId]) return { xp: 0, level: 0 };
  const data = xpData[guildId][userId];
  return {
    xp: Math.max(0, data.xp),
    level: Math.max(0, data.level),
  };
}

// ⏭️ XP to next level
function getXpToNextLevel(userId, guildId) {
  const user = getUserStats(userId, guildId);
  const nextLevel = user.level + 1;
  return Math.max(0, getXpForLevel(nextLevel) - user.xp);
}

module.exports = {
  addXp,
  getUserStats,
  getLevelFromXp,
  getXpForLevel,
  getXpToNextLevel,
  refreshXpCache,
  xpData, // optional direct read
};
