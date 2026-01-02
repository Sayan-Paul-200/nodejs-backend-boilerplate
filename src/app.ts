// application

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { config } from "dotenv"; // Load env vars
import { ApiError } from "./utils/ApiError";
import { ApiResponse } from "./utils/ApiResponse";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

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
// 1. GLOBAL MIDDLEWARES (MUST BE FIRST)
// ==================================================

// Security Headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

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

// 📖 Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ==================================================
// 2. SPECIAL ROUTES (BEFORE BODY PARSING)
// ==================================================

// 🔧 FIX: Move global JSON parsing AFTER the webhook route
// Webhooks need the RAW body for signature verification.
// If we run express.json() globally first, it breaks the signature.
app.use("/api/v1/billing", billingRoutes);

// ==================================================
// 3. BODY PARSING & STANDARD ROUTES
// ==================================================

// 🔍 THE FIX: Body Parsing MUST be here (Before other Routes, After Webhooks)
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Home Route
app.get("/", (_, res) => {
  res.status(200).json(new ApiResponse(200, null, "Welcome to the Enterprise Node.js Backend 🚀"));
});

// Health Check
app.get("/health", (_, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Standard API Routes
app.use("/uploads", express.static("uploads"));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/organizations", orgRoutes);

// ==================================================
// 4. ERROR HANDLING (MUST BE LAST)
// ==================================================

// 404 Handler (Resource not found)
app.use((req, res, next) => {
  next(new ApiError(404, "Resource not found"));
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    // Only show stack trace in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };