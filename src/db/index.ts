// Drizzle ORM initialization and database connection setup

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "../config/env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Add a simple error listener to the pool too
pool.on("error", (err) => {
  console.error("❌ Database Connection Error:", err);
});

export const db = drizzle(pool, { schema });
export { pool };