import Redis, { RedisOptions } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | null | undefined;
};

function createRedisClient(): Redis | null {
  if (!REDIS_URL) {
    console.warn('⚠️ [Redis] REDIS_URL is not configured. Caching is disabled.');
    return null;
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableAutoPipelining: true,
    connectTimeout: 8000,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 100, 2000);
    },
  };

  try {
    const client = new Redis(REDIS_URL, options);

    client.on('connect', () => {
      console.log('✅ [Redis] Connected successfully');
    });

    client.on('error', (err) => {
      console.error('❌ [Redis] Connection error:', err.message);
    });

    return client;
  } catch (error) {
    console.error('❌ [Redis] Failed to initialize client:', error);
    return null;
  }
}

export const redis =
  globalForRedis.redisClient ?? createRedisClient();

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redisClient = redis;
}

/**
 * Retrieve cached data by key.
 * Safely handles parse errors or Redis connection drops without throwing.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Redis] getCachedData error for key "${key}":`, (err as Error).message);
    return null;
  }
}

/**
 * Set cached data with optional Time-To-Live in seconds.
 * Defaults to 300 seconds (5 minutes) if ttl is omitted.
 */
export async function setCachedData(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  if (!redis) return;
  try {
    const stringified = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.set(key, stringified, 'EX', ttlSeconds);
    } else {
      await redis.set(key, stringified);
    }
  } catch (err) {
    console.warn(`[Redis] setCachedData error for key "${key}":`, (err as Error).message);
  }
}

/**
 * Invalidate a single key or pattern of keys (e.g. "notes:user123:*").
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  if (!redis) return;
  try {
    if (keyOrPattern.includes('*')) {
      const keys = await redis.keys(keyOrPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(keyOrPattern);
    }
  } catch (err) {
    console.warn(`[Redis] invalidateCache error for "${keyOrPattern}":`, (err as Error).message);
  }
}

/**
 * Convenience helper to clear all cached queries for a given user.
 */
export async function invalidateUserNotesCache(userId: string): Promise<void> {
  if (!userId) return;
  await invalidateCache(`notes:${userId}:*`);
}
