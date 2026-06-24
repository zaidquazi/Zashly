import Redis from 'ioredis';
import Redlock from 'redlock';
import logger from '../monitoring/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const USE_REDIS = process.env.REDIS_URL || false;
let redisClient = null;
let redlock = null;

if (USE_REDIS) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 100, 3000);
    }
  });
  
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.on('connect', () => logger.info('Redis Client Connected'));
  
  redlock = new Redlock([redisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200,
  });
  redlock.on('clientError', err => logger.error('Redlock client error:', err));
} else {
  // In-memory fallback for local dev without Redis
  logger.info('Redis not configured. Using in-memory locks.');
  const locks = new Set();
  redlock = {
    acquire: async (resources, ttl) => {
      const resource = resources[0];
      if (locks.has(resource)) throw new Error('Lock already acquired');
      locks.add(resource);
      
      const timeout = setTimeout(() => locks.delete(resource), ttl);
      
      return {
        release: async () => {
          clearTimeout(timeout);
          locks.delete(resource);
        }
      };
    }
  };
}

export { redisClient, redlock };
