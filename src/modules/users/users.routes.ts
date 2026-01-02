import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { upload } from "../../services/storage.service";
import { updateProfilePicture } from "./users.controller";

const router = Router();

// Endpoint: POST /api/v1/users/me/avatar
// 1. verifyJWT: Ensures user is logged in
// 2. upload.single("avatar"): Handles the file upload (expecting field name 'avatar')
router.post(
  "/me/avatar", 
  verifyJWT, 
  upload.single("avatar"), 
  updateProfilePicture
);

export default router;