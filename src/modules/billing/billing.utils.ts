import { db } from "../../db";
import { products, organizations } from "../../db/schema";
import { eq, count } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";
import { BILLING_CONFIG } from "../../config/billing.config";

export const checkProductLimit = async (orgId: string) => {
  // 1. Get Org Plan
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { 
      plan: true,
      subscriptionStatus: true,
     }
  });

  if (!org) throw new ApiError(404, "Organization not found");

  // 2. Determine Effective Plan
  // Logic: If status is NOT active or trialing, force them to 'free' limits
  // This handles 'past_due', 'unpaid', or 'incomplete' states instantly.
  let effectivePlan = org.plan;
  
  const validStatuses = ["active", "trialing"];
  if (org.plan !== "free" && !validStatuses.includes(org.subscriptionStatus || "")) {
    effectivePlan = "free"; 
  }

  // 3. Count current products
  // We use a raw count query for performance
  const [result] = await db
    .select({ value: count() })
    .from(products)
    .where(eq(products.organizationId, orgId));
  
  const currentCount = result.value;
  
  // 4. Check Limit
  // We type-cast to ensure TypeScript knows we are accessing valid keys
  const planConfig = BILLING_CONFIG.plans[org.plan as keyof typeof BILLING_CONFIG.plans] || BILLING_CONFIG.plans.free;
  const limit = planConfig.limit;

  if (currentCount >= limit) {
    throw new ApiError(
      403, 
      `Plan limit reached (${currentCount}/${limit}). ` + 
      (effectivePlan === "free" && org.plan === "pro" 
        ? "Your subscription is past due. Please update payment." 
        : "Please upgrade to PRO to create more products.")
    );
  }
};