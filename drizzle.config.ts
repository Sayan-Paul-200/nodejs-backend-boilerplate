import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { env } from "./src/config/env";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle", // Folder where .sql migration files will be stored
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});