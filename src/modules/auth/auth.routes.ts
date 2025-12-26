// Routes definition for authentication module and middleware usage

import { Router } from "express";
import { register, login, refresh, getCurrentUser } from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation";

const router = Router();

// ==========================================
// 🔓 PUBLIC ROUTES (No Middleware Attached)
// ==========================================
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh-token", validateRequest(refreshTokenSchema), refresh);

// ==========================================
// 🔒 PROTECTED ROUTES (Middleware Attached Explicitly)
// ==========================================

// Notice: We put 'verifyJWT' directly inside the route definition
router.get("/me", verifyJWT, getCurrentUser);

export default router;