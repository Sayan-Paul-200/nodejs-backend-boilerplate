// application

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "./utils/ApiError";
import authRoutes from "./modules/auth/auth.routes";
import { ApiResponse } from "./utils/ApiResponse";

const app = express();

// 1. Security Middleware
app.use(helmet()); // Secure Headers

const whitelist = process.env.CORS_ORIGIN?.split(",") || [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new ApiError(403, "Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. Body Parsing
app.use(express.json({ limit: "16kb" })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// 4. Logging
// Only log if we are NOT in the 'test' environment
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// 5. Routes (Health Check)
app.get("/", (_, res) => {
  res.status(200).json(new ApiResponse(200, null, "Welcome to Sayan's Node.js backend boilerplate 🚀"));
});
app.get("/health", (_, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// 5. Routes (API)
app.use("/api/v1/auth", authRoutes);

// 6. Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };