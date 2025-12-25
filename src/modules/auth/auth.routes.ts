// Routes definition for authentication module and middleware usage

import { Router } from "express";
import { register, login, getCurrentUser } from "./auth.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Routes
// All routes below this line will require a valid token
router.use(verifyJWT); 

router.get("/me", getCurrentUser);

export default router;