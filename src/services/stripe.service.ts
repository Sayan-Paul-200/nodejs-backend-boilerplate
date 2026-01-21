import Stripe from "stripe";
import { env } from "../config/env";

const STRIPE_KEY = env.STRIPE_SECRET_KEY || "sk_test_placeholder";

// Initialize Stripe
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2025-12-15.clover" as any, // Use latest API version or valid string
  typescript: true,
});

export const createPortalSession = async (customerId: string) => {

  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.FRONTEND_URL}/dashboard`, // Where to send them back after they are done
  });
};

export const createStripeCustomer = async (email: string, name: string) => {
  return await stripe.customers.create({ email, name });
};

export const createCheckoutSession = async (
  customerId: string, 
  priceId: string, 
  orgId: string
) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/dashboard?billing=success`,
    cancel_url: `${env.FRONTEND_URL}/billing?billing=cancelled`,
    // Metadata is KEY: It tells the webhook WHICH Org to upgrade later
    metadata: { orgId }
  });
};

export const constructEvent = (body: any, signature: string | string[]) => {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error("Missing Webhook Secret");
  return stripe.webhooks.constructEvent(
    body, 
    signature as string, 
    env.STRIPE_WEBHOOK_SECRET
  );
};