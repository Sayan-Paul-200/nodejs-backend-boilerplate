// Entry point of the application

import dotenv from "dotenv";

dotenv.config();

import { app } from "./app";
import { db } from "./db";
import logger from "./config/logger";
import { sql } from "drizzle-orm";

if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error("❌ FATAL ERROR: ACCESS_TOKEN_SECRET is not defined in .env file.");
  process.exit(1); // Stop the server instantly if secret is missing
}

if (!process.env.DATABASE_URL) {
  console.error("❌ FATAL ERROR: DATABASE_URL is not defined in .env file.");
  process.exit(1);
}

const PORT = process.env.PORT || 8000;

// Test DB connection before starting
const init = async () => {
  try {
    // A simple query to ensure DB is connected
    await db.execute(sql`SELECT 1`); 
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`🔑 Loaded JWT Secret: ${process.env.ACCESS_TOKEN_SECRET?.slice(0, 5)}...`);
    });
  } catch (error) {
    logger.error("Database connection failed", error);
    process.exit(1);
  }
};

init();