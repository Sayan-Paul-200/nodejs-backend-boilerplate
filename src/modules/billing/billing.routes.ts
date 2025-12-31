import { Router, raw, json } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { subscribe, webhook, createPortal } from "./billing.controller";

const router = Router();

// Public Route (Stripe needs to hit this externally)
// Use 'raw' middleware locally for this specific route
router.post("/webhook", raw({ type: "application/json" }), webhook);

// Protected Routes
router.post("/subscribe", json(), verifyJWT, subscribe);
router.post("/portal", json(), verifyJWT, createPortal);

export default router;