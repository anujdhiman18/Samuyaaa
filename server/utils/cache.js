/**
 * Simple In-Memory Cache for MongoDB Query Results
 *
 * Why: MongoDB Atlas is a cloud database. Every query has ~200-500ms network
 * round-trip latency. Caching frequently-read collections in server memory
 * makes subsequent reads instant (< 1ms) until the cache expires.
 *
 * TTL defaults:
 *  - List endpoints (students, faculty, etc.): 60 seconds
 *  - Short-lived (leaves, applications): 30 seconds
 */

const store = new Map();

/**
 * Get a value from cache
 * @param {string} key
 * @returns {any|null} cached value or null if missing/expired
 */
export const cacheGet = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Set a value in cache with TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - default 60 seconds
 */
export const cacheSet = (key, value, ttlSeconds = 60) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

/**
 * Invalidate (delete) one or more cache keys by prefix or exact key
 * Call this on any write operation (create/update/delete) so stale data
 * is never served after a mutation.
 * @param {string} keyOrPrefix
 */
export const cacheInvalidate = (keyOrPrefix) => {
  for (const key of store.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      store.delete(key);
    }
  }
};

/**
 * Clear the entire cache (useful on server restart / emergency flush)
 */
export const cacheClear = () => store.clear();

export default { cacheGet, cacheSet, cacheInvalidate, cacheClear };
