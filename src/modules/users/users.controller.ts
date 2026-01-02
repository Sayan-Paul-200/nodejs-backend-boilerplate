import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const updateProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  // 1. Check if file exists (Multer puts it here)
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  // 2. Construct the Public URL
  // Note: In production (AWS S3), this would be the S3 URL. 
  // For local, we construct the localhost URL.
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  // 3. Update the User in DB
  // req.user.id comes from the verifyJWT middleware
  await db.update(users)
    .set({ userPhotoUrl: fileUrl })
    .where(eq(users.id, req.user!.id));

  return res
    .status(200)
    .json(new ApiResponse(200, { url: fileUrl }, "Profile picture updated successfully"));
});