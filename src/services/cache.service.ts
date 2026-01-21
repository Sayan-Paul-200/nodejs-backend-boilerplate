import IORedis from "ioredis";
import { env } from "../config/env";
import logger from "../config/logger";

class CacheService {
  private redis: IORedis;

  constructor() {
    this.redis = new IORedis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT),
      maxRetriesPerRequest: null,
    });

    this.redis.on("connect", () => logger.info("✅ Redis Cache Connected"));
    this.redis.on("error", (err) => logger.error("❌ Redis Cache Error", err));
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Set data to cache with Expiration (TTL) in seconds
  async set(key: string, value: any, ttlSeconds: number = 3600) {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  // Delete a specific key
  async del(key: string) {
    await this.redis.del(key);
  }

  // Clear all keys matching a pattern (Useful for "Invalidate all Products")
  async clearPattern(pattern: string) {
    const stream = this.redis.scanStream({ match: pattern });
    stream.on("data", (keys) => {
      if (keys.length) {
        this.redis.unlink(keys);
      }
    });
  }
}

export const cacheService = new CacheService();