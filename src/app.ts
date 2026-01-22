// application

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Redis } from "ioredis";
import { config } from "dotenv";
import { ApiError } from "./utils/ApiError";
import { ApiResponse } from "./utils/ApiResponse";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestId";

// Route Imports
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/products.routes";
import orgRoutes from "./modules/organizations/organizations.routes";
import billingRoutes from "./modules/billing/billing.routes";
import userRoutes from "./modules/users/users.routes";

// Load environment variables
config();

const app = express();

// ==================================================
// 1. GLOBAL MIDDLEWARES (ORDER MATTERS)
// ==================================================

// A. Security & Observability (First)
app.use(helmet());
app.use(requestLogger); // 🆔 Traceability: Adds x-request-id to every log/response

// B. Logging
if (env.NODE_ENV !== "test") {
  // Modified Morgan to log the Request ID
  morgan.token("id", (req: any) => req.id);
  app.use(morgan("[:id] :method :url :status :response-time ms"));
}

// C. CORS
const whitelist = env.CORS_ORIGIN?.split(",") || [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new ApiError(403, "Not allowed by CORS"));
      }
    },
    credentials: true, // Required for Cookies
  })
);

// D. Performance & parsing
app.use(compression()); // 🚀 Gzip Compression (Shrinks responses)
app.use(cookieParser()); // 🍪 Parses cookies (Essential for secure Refresh Tokens)

// ==================================================
// 2. SPECIAL ROUTES (BEFORE BODY PARSING)
// ==================================================

app.use("/api/v1/billing", billingRoutes);

// ==================================================
// 3. BODY PARSING & SECURITY (AFTER WEBHOOKS)
// ==================================================

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(hpp()); // 🛡️ HTTP Parameter Pollution Protection (Must be after body parser)

// 📖 Swagger Documentation
const swaggerFile = path.join(__dirname, "swagger_output.json");
if (fs.existsSync(swaggerFile)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFile, "utf-8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// 🛡️ Distributed Rate Limiting (Redis)
// Create a dedicated Redis client for the limiter
const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  tls: ["localhost", "redis"].includes(env.REDIS_HOST) ? undefined : {
    rejectUnauthorized: false
  },
  retryStrategy: (times) => Math.min(times * 50, 2000),
  // enableOfflineQueue: false, // Fail fast if Redis is down
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
  // Do NOT throw here. Just log it. The client will auto-reconnect.
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const [command, ...params] = args; // Separate command from params
      const result = await redisClient.call(command, ...params); // Call Redis
      return result as any; // Cast 'unknown' to satisfy the library's type expectation
    },
  }),
  // Handler for when limit is reached
  handler: (req, res) => {
    res.status(429).json(
      new ApiError(429, "Too many requests, please try again later.")
    );
  },
});
app.use(limiter);

// ==================================================
// 4. API ROUTES
// ==================================================

// Home & Health
app.get("/", (_, res) => {
  res.status(200).json(new ApiResponse(200, null, "Welcome to the Enterprise Node.js Backend 🚀"));
});
app.get("/health", (_, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Module Routes
app.use("/uploads", express.static("uploads"));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/organizations", orgRoutes);

// ==================================================
// 5. ERROR HANDLING
// ==================================================

app.use((req, res, next) => {
  next(new ApiError(404, "Resource not found"));
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // 🛑 OPTIMIZATION: Only log "Server Errors" (500+) or all errors in Development.
  // This prevents production logs from being flooded by "401 Invalid Password" or "404 Not Found" events from bots/scanners.
  if (statusCode >= 500 || env.NODE_ENV === "development") {
    console.error(`[${(req as any).id}] ❌ Error: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    requestId: (req as any).id, // Help the frontend dev trace the error
    errors: err.errors || [],
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };