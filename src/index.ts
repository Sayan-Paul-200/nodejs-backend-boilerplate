// Entry point of the application

import { app } from "./app";
import { db } from "./db";
import logger from "./config/logger";
import { sql } from "drizzle-orm";
import { env } from "./config/env";

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
const shutdown = (signal: string) => {
  logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);

  if (server) {
    // 1. Stop accepting new requests
    server.close(() => {
      logger.info("HTTP server closed. Pending requests finished.");
      
      // 2. (Optional) Close Database/Redis connections here if you export the pool
      // await pool.end(); 

      logger.info("Process terminated.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // 3. Force shutdown if it takes too long (e.g. hung connections)
  setTimeout(() => {
    logger.error("Forcing shutdown after timeout...");
    process.exit(1);
  }, 10000); // 10 seconds
};

// Listen for termination signals (e.g., Docker stop, Ctrl+C)
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));