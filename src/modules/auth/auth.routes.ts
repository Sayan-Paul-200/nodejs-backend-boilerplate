import { Router } from "express";
import { register, login, refresh, getCurrentUser, acceptInvite, forgotPassword, resetPassword } from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation";

const router = Router();

// Public
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh-token", validateRequest(refreshTokenSchema), refresh);
router.post("/accept-invite", acceptInvite);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected
router.get("/me", verifyJWT, getCurrentUser);

export default router;