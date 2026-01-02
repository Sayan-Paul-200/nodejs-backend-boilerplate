// Routes definition for authentication module and middleware usage

import { Router } from "express";
import { register, login, refresh, getCurrentUser, acceptInvite, forgotPassword, resetPassword } from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation";

const router = Router();

// ==========================================
// 🔓 PUBLIC ROUTES (No Middleware Attached)
// ==========================================
router.post("/register", validateRequest(registerSchema), register);
/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Log in a user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * password:
 * type: string
 * responses:
 * 200:
 * description: Successful login
 * 401:
 * description: Invalid credentials
 */
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh-token", validateRequest(refreshTokenSchema), refresh);
router.post("/accept-invite", acceptInvite); // Add validation middleware if desired
// 🆕 Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ==========================================
// 🔒 PROTECTED ROUTES (Middleware Attached Explicitly)
// ==========================================

// Notice: We put 'verifyJWT' directly inside the route definition
router.get("/me", verifyJWT, getCurrentUser);

export default router;