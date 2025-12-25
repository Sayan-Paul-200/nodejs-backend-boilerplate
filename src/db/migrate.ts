import dotenv from "dotenv";
// 1. CRITICAL: Load Env Vars BEFORE importing db
dotenv.config(); 

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index"; 
import logger from "../config/logger";

const runMigrations = async () => {
  try {
    logger.info("⏳ Starting database migration...");
    
    // This runs the migrations inside the 'drizzle' folder
    await migrate(db, { migrationsFolder: "drizzle" });
    
    logger.info("✅ Database migration completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Database migration failed", error);
    process.exit(1);
  }
};

runMigrations();