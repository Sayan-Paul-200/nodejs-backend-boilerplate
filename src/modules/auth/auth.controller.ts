// Handler for user registration

import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { registerUser } from "./auth.service";
import { loginUser } from "./auth.service";
import { verifyJWT } from "../../middlewares/auth.middleware"; // Not used here, used in routes

// 1. Register Controller
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Note: Add Zod validation here in a real scenario
  
  const user = await registerUser(email, password);
  
  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

// 2. Login Controller
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Zod validation would go here
  
  const { user, accessToken } = await loginUser(email, password);

  // Security Note: For high security, send token in HTTPOnly Cookie, 
  // but for mobile/standard APIs, JSON response is common.
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user, accessToken }, "User logged in successfully")
    );
});

// 3. Protected Route Controller (Example)
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // req.user is now available thanks to verifyJWT
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});