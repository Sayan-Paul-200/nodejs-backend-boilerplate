import { env } from "../config/env";

// Centralized Queue Name to prevent import circles
export const EMAIL_QUEUE_NAME = "email-queue";

// Shared Redis Configuration
// We export the *options* object, not the instance.
// BullMQ will use this to create its own connections internally.
export const redisConfig = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  maxRetriesPerRequest: null, // ⚠️ Strictly required by BullMQ
};