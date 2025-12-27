import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { USER_NAME_LENGTH, USER_PROFILE_PIC_URL_LENGTH } from "./_constants";
import { organizations } from "./organizations";

// 1. Define the Role Enum (Extensible for your SaaS)
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "member", "guest"]);

export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  
  fullName: varchar("full_name", { length: USER_NAME_LENGTH }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  organizationId: uuid("organization_id")
    .references(() => organizations.id), // Nullable for now (backward compatibility)
  
  // 2. New IAM Fields
  role: userRoleEnum("role").notNull().default("member"),
  
  // Stores overrides like: ["billing:invoice:F", "projects:settings:4"]
  customPermissions: text("custom_permissions").array().default(sql`ARRAY[]::text[]`), 

  userPhotoUrl: varchar("user_photo_url", { length: USER_PROFILE_PIC_URL_LENGTH }),
  userNotes: text("user_notes"),
  status: userStatusEnum("status").notNull().default("active"),
  
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});