import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as stripeService from "../../services/stripe.service";
import { db } from "../../db";
import { organizations } from "../../db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "../system/audit.service";
import { BILLING_CONFIG } from "../../config/billing.config";

// 1. Start Subscription (GET /api/v1/billing/subscribe)
export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as any;
  const { priceId } = req.body; // e.g., 'price_12345...' from Frontend

  // Get Org to find/create Stripe Customer ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId)
  });
  
  if (!org) throw new ApiError(404, "Organization not found");

  let customerId = org.stripeCustomerId;

  // Lazy Create: If this Org doesn't have a Stripe ID yet, create one now
  if (!customerId) {
    const customer = await stripeService.createStripeCustomer(user.email, org.name);
    customerId = customer.id;
    
    // Save it for next time
    await db.update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, org.id));
  }

  // Determine which Price ID to use
  // Priority: Body (Frontend) -> Config Default -> Error
  const selectedPriceId = priceId || BILLING_CONFIG.plans.pro.priceId;

  if (!selectedPriceId) {
    throw new ApiError(500, "Stripe Price ID is not configured on the server.");
  }

  // Create the Checkout Link
  const session = await stripeService.createCheckoutSession(
    customerId, 
    selectedPriceId,
    org.id
  );

  res.status(200).json({ url: session.url });
});

// 2. The Webhook (POST /api/v1/billing/webhook)
// NOTE: This does NOT use asyncHandler because we need raw control over response
export const webhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  try {
    const event = stripeService.constructEvent(req.body, signature!);
    
    // We switch on the Event Type
    switch (event.type) {
      
      // ✅ Case 1: Initial Payment Success
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const orgId = session.metadata?.orgId;
        if (orgId) {
          await db.update(organizations)
            .set({ plan: "pro", subscriptionStatus: "active" })
            .where(eq(organizations.id, orgId));
            
          console.log(`💰 Payment Success! Upgrading Org: ${orgId}`);
          
          logAudit({ userId: null, organizationId: orgId, action: "SUBSCRIPTION_UPGRADE", resource: `org:${orgId}` });
        }
        break;
      }

      // 🔄 Case 2: Status Change (Payment Failed, Past Due, Renewed)
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status; // active, past_due, canceled, unpaid

        // Map Stripe status to our DB status
        // If 'active' or 'trialing', they keep PRO. Otherwise, potentially downgrade.
        // For simplicity, we just sync the status string first.
        await db.update(organizations)
          .set({ subscriptionStatus: status as any })
          .where(eq(organizations.stripeCustomerId, customerId));
        
        console.log(`🔄 Subscription Updated for Customer ${customerId}: ${status}`);
        break;
      }

      // ❌ Case 3: Cancellation (Explicit Delete)
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // DOWNGRADE LOGIC
        const [updatedOrg] = await db.update(organizations)
          .set({ 
            plan: "free", 
            subscriptionStatus: "canceled" 
          })
          .where(eq(organizations.stripeCustomerId, customerId))
          .returning();

        if (updatedOrg) {
          console.log(`❌ Subscription Canceled for Customer ${customerId}. Downgraded to FREE.`);
          
          // Audit Log (Optional)
          logAudit({
             userId: null,
             organizationId: updatedOrg.id,
             action: "SUBSCRIPTION_DOWNGRADE",
             resource: `org:${updatedOrg.id}`,
             metadata: { from: "pro", to: "free" }
          });
        } else {
           // ⚠️ This would have caught your issue!
           console.warn(`⚠️ IGNORED Cancellation: Customer ID ${customerId} not found in database.`);
        }
        
        break;
      }
    }

    res.status(200).send();
  } catch (err: any) {
    console.error(`⚠️ Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// 3. Manage Subscription (POST /api/v1/billing/portal)
export const createPortal = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as any;

  // 1. Get Org
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId)
  });

  if (!org || !org.stripeCustomerId) {
    throw new ApiError(400, "No billing account found for this organization");
  }

  // 2. Create Portal Link
  const session = await stripeService.createPortalSession(org.stripeCustomerId);

  res.status(200).json({ url: session.url });
});