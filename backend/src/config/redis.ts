import Redis from 'ioredis';

let redisClient: Redis;

export async function connectRedis(): Promise<Redis> {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error('❌ Redis error:', err));

  return redisClient;
}

export function getRedis(): Redis {
  if (!redisClient) throw new Error('Redis not initialized');
  return redisClient;
}
