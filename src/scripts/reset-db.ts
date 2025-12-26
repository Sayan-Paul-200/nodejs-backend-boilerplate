// Drop the entire database schema.

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../db";

async function reset() {
  console.log("🧨 Destroying database schema...");
  
  // This drops the public schema and recreates it (Wipes EVERYTHING)
  await db.execute(sql`DROP SCHEMA public CASCADE;`);
  await db.execute(sql`CREATE SCHEMA public;`);
  
  // Re-grant permissions (standard Postgres setup)
  await db.execute(sql`GRANT ALL ON SCHEMA public TO postgres;`);
  await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);

  console.log("✅ Database wiped successfully!");
  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});