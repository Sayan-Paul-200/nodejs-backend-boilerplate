import { z } from "zod";
import dotenv from "dotenv";

// Load .env file locally
dotenv.config();

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("8000"),

  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  ACCESS_TOKEN_SECRET: z.string().min(10, "ACCESS_TOKEN_SECRET is too short"),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),

  // Email Configuration (Nodemailer)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(), // Keep as string to avoid parsing issues, convert where needed
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"), // Enforce string boolean for clarity

  // Sender Identity
  FROM_EMAIL: z.string().email().default("no-reply@example.com"),
  FROM_NAME: z.string().default("Sayan Enterprises"),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "Must start with sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "Must start with whsec_").optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_", "Must start with price_").optional(),
});

// Validate process.env
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;