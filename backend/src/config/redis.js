const { createClient } = require('redis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

client.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Redis] Connection warning:', err.message);
  }
});

client.on('connect', () => {
  console.log('[Redis] Connected');
});

client.on('ready', () => {
  console.log('[Redis] Ready');
});

client.on('end', () => {
  console.log('[Redis] Connection closed');
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.warn('[Redis] Initial connection failed (will retry):', err.message);
  }
})();

module.exports = client;