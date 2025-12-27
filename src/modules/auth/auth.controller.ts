// Handler for user registration

import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import * as AuthService from "./auth.service";
import { logAudit } from "../system/audit.service";

// 1. Register Controller
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Data is already validated by Zod middleware at the route level
  const { email, password, fullName } = req.body;

  const user = await AuthService.registerUser(email, password, fullName);

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

// 2. Login Controller
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await AuthService.loginUser(
    email,
    password
  );

  // 🕵️ AUDIT LOG: User Login
  logAudit({
    userId: user.id,
    organizationId: user.organizationId,
    action: "USER_LOGIN",
    resource: `user:${user.id}`,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { user, accessToken, refreshToken },
      "User logged in successfully"
    )
  );
});

// 3. Refresh Token Controller (New "Path C" Security)
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await AuthService.refreshUserToken(refreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, tokens, "Access token refreshed successfully"));
});

// 4. Protected Route Controller
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // req.user is injected by verifyJWT middleware
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// 5. Register via Invitation Controller
export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, fullName, password } = req.body;
  const user = await AuthService.registerViaInvite(token, fullName, password);
  
  res.status(201).json({
    success: true,
    message: "User registered and joined organization successfully",
    data: { email: user.email }
  });
});