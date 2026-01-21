import { Request, Response, NextFunction } from "express";
import { cacheService } from "../services/cache.service";
import logger from "../config/logger";

export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    // Generate a unique key based on URL and User's Org (Data Isolation)
    // Key format: "cache:/api/v1/products?page=1:org:123"
    const orgId = (req.user as any)?.organizationId || "public";
    const key = `cache:${req.originalUrl}:org:${orgId}`;

    try {
      const cachedData = await cacheService.get(key);

      if (cachedData) {
        logger.info(`⚡ Cache Hit: ${key}`);
        // Return JSON immediately, bypass Controller
        return res.json(cachedData);
      }

      // If not in cache, we need to intercept the response.send() to save it later
      const originalSend = res.json;

      res.json = (body) => {
        // Save the body to Redis before sending to user
        cacheService.set(key, body, ttlSeconds).catch((err) => {
          logger.error("Failed to save cache", err);
        });

        // Restore original send and call it
        return originalSend.call(res, body);
      };

      next();
    } catch (error) {
      logger.error("Cache Middleware Error", error);
      next(); // If Redis fails, fall back to DB (Fail Open)
    }
  };
};