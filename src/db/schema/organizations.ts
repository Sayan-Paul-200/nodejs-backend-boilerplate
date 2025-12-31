import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Define the Enums
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "incomplete", "trialing"]);

export const organizations = pgTable("organizations", {
  id: uuid("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),

  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }), // Links to Stripe Dashboard
  plan: subscriptionPlanEnum("plan").default("free").notNull(),     // The source of truth for features
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("active"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});