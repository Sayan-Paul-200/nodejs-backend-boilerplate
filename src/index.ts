// Entry point of the application

import dotenv from "dotenv";
import { app } from "./app";
import { db } from "./db";
import logger from "./config/logger";
import { sql } from "drizzle-orm";

dotenv.config();

const PORT = process.env.PORT || 8000;

// Test DB connection before starting
const init = async () => {
  try {
    // A simple query to ensure DB is connected
    await db.execute(sql`SELECT 1`); 
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Database connection failed", error);
    process.exit(1);
  }
};

init();