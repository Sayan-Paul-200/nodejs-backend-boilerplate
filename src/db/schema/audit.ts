import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, jsonb, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { organizations } from "./organizations";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Who did it? (Nullable because sometimes the System does things)
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Which Org does this belong to? (Crucial for Tenant Isolation)
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),

  // What happened?
  action: varchar("action", { length: 50 }).notNull(), // e.g., "USER_LOGIN", "PRODUCT_CREATED"
  
  // What was affected?
  resource: varchar("resource", { length: 100 }), // e.g., "product:12345"
  
  // Extra details (snapshot of data)
  metadata: jsonb("metadata"), 
  
  // Security Context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});