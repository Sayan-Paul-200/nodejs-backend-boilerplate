import { env } from "../config/env";
import { ConnectionOptions } from "bullmq";

// Centralized Queue Name to prevent import circles
export const EMAIL_QUEUE_NAME = "email-queue";

// Shared Redis Configuration
// We export the *options* object, not the instance.
// BullMQ will use this to create its own connections internally.
export const redisConfig = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  tls: env.REDIS_HOST === "localhost" ? undefined : {
    rejectUnauthorized: false, // Fixes "self-signed certificate" errors on some providers
  },
  maxRetriesPerRequest: null, // ⚠️ Strictly required by BullMQ
  enableReadyCheck: false,
};