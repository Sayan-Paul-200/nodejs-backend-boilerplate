import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";
import { userRoleEnum } from "./users"; // Import the existing Role enum

export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(), // Secure URL token
  
  // 🔗 Link to the Org they are invited to
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
    
  // 🎭 What role will they have?
  role: userRoleEnum("role").notNull().default("member"),
  
  status: invitationStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id), // Who sent the invite?

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});