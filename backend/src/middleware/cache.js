const redisClient = require('../config/redis');

/**
 * Redis Caching Middleware
 * Wraps the response object to automatically cache successful GET requests.
 */
const cache = (durationSeconds = 60) => async (req, res, next) => {
  // Fail-safe: Skip caching if Redis is down
  if (!redisClient.isOpen) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Cache] Redis not connected → skipping');
    }
    return next();
  }

  // Create unique cache key based on route and query params
  const key = `cache:${req.method}:${req.originalUrl || req.url}`;

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      // Cache HIT: Return data immediately
      return res.json(JSON.parse(cached));
    }

    // Cache MISS: Intercept res.json to store data before sending to client
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode === 200) {
        redisClient.setEx(key, durationSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson.apply(this, arguments);
    };

    next();
  } catch (err) {
    console.warn('[Cache] Middleware error:', err.message);
    next();
  }
};

module.exports = cache;