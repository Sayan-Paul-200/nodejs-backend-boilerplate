// application

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "./utils/ApiError";
import { ApiResponse } from "./utils/ApiResponse";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/products.routes";

const app = express();

// ==================================================
// 1. GLOBAL MIDDLEWARES (MUST BE FIRST)
// ==================================================

// Security Headers
app.use(helmet());

// CORS Policy
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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 🔍 THE FIX: Body Parsing MUST be here (Before Routes)
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// ==================================================
// 2. ROUTES
// ==================================================

// Home Route
app.get("/", (_, res) => {
  res.status(200).json(new ApiResponse(200, null, "Welcome to the Enterprise Node.js Backend 🚀"));
});

// Health Check
app.get("/health", (_, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);

// ==================================================
// 3. GLOBAL ERROR HANDLER (MUST BE LAST)
// ==================================================
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