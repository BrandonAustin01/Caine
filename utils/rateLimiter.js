// utils/rateLimiter.js

const rateCache = new Map();

function isRateLimited(key, timeoutMs) {
  const now = Date.now();

  if (!rateCache.has(key)) {
    rateCache.set(key, now);
    return false; // not rate limited
  }

  const last = rateCache.get(key);

  if (now - last < timeoutMs) {
    return true; // still in timeout
  }

  rateCache.set(key, now); // refresh
  return false;
}

module.exports = {
  isRateLimited,
};
