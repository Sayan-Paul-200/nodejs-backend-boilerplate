import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations"; // Import the reference

export const products = pgTable("products", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  
  // 🔒 The Tenant Lock
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Stored in cents ($10.00 = 1000)
  stock: integer("stock").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // 🗑️ Soft Delete Field
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});