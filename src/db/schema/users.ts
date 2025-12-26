import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, date, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { USER_NAME_LENGTH, USER_PROFILE_PIC_URL_LENGTH } from "./_constants";

export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);

export const users = pgTable("users", {
  // UUIDv7 Primary Key
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`), // Note: Using native gen_random_uuid() for compatibility until uuidv7() func is added
  
  fullName: varchar("full_name", { length: USER_NAME_LENGTH }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(), // Added email for auth
  passwordHash: text("password_hash").notNull(), // Simplified for boilerplate (vs user_credentials table)
  
  userPhotoUrl: varchar("user_photo_url", { length: USER_PROFILE_PIC_URL_LENGTH }),
  userNotes: text("user_notes"),
  status: userStatusEnum("status").notNull().default("active"),
  
  // Standardized UTC Timestamps
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});