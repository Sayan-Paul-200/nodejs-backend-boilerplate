// Entry point of the application

import { app } from "./app";
import { db } from "./db";
import logger from "./config/logger";
import { sql } from "drizzle-orm";
import { env } from "./config/env";
import { emailWorker } from "./jobs/email.worker";

// Note: We removed manual 'dotenv' and 'process.env' checks 
// because src/config/env.ts now handles validation automatically.

const PORT = env.PORT;

let server: any; // Reference to the HTTP server

const init = async () => {
  try {
    // A simple query to ensure DB is connected
    await db.execute(sql`SELECT 1`); 
    logger.info("Database connected successfully");

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`🔑 Loaded JWT Secret: ${env.ACCESS_TOKEN_SECRET.slice(0, 5)}...`);
      logger.info(`👷 Email Worker started successfully`);
    });
  } catch (error) {
    logger.error("Database connection failed", error);
    process.exit(1);
  }
};

init();

// ==========================================
// 🛑 GRACEFUL SHUTDOWN LOGIC
// ==========================================
const shutdown = async (signal: string) => {
  logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);

  // 1. Close HTTP Server (Stop new API requests)
  if (server) {
    server.close(() => {
      logger.info("HTTP server closed. Pending requests finished.");
    });
  }

  try {
    // 2. Close Worker (Finish current email job, then stop)
    await emailWorker.close();
    logger.info("👷 Email Worker closed gracefully.");

    // 3. (Optional) Close Database Connection
    // await db.end(); 

    logger.info("Process terminated.");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", error);
    process.exit(1);
  }
};

// Listen for termination signals (e.g., Docker stop, Ctrl+C)
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));