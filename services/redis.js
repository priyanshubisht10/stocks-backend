const Redis = require('ioredis');

const redis = new Redis({
   host: '127.0.0.1',
   port: 6379,
   maxRetriesPerRequest: null,    // Disable request retries
   enableReadyCheck: false,       // Skip the initial ready check for faster connection
   reconnectOnError: (err) => {
      console.log('Redis error:', err);
      return true;
   },
});

redis.on('connect', () => {
   console.log('Connected to Redis!');
});

redis.on('error', (err) => {
   console.error('Redis connection error:', err);
});

redis.on('reconnecting', (delay) => {
   console.log(`Reconnecting to Redis in ${delay}ms...`);
});

module.exports = redis;
