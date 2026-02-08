import Redis from 'ioredis';
import { config } from '../config';

let redisClient: Redis;

export async function connectRedis(): Promise<void> {
  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  
  redisClient.on('connect', () => {
    console.log('✓ Connected to Redis');
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
  
  await redisClient.ping();
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log('✓ Redis connection closed');
  }
}

export function getRedisClient(): Redis {
  return redisClient;
}
