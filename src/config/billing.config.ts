import { env } from "./env";

export const BILLING_CONFIG = {
  plans: {
    free: {
      name: "Free",
      limit: 5,
      priceId: null, // Free plans don't have a Stripe Price ID
    },
    pro: {
      name: "Pro",
      limit: 100,
      priceId: env.STRIPE_PRO_PRICE_ID, // Loaded from .env
    },
    enterprise: {
      name: "Enterprise",
      limit: 999999,
      priceId: null, // Custom pricing usually
    },
  },
};