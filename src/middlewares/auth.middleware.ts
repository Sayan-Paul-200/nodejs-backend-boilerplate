// Interceptor middleware to verify JWT tokens

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
      };
    }
  }
}

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // DEBUG LOG: See what route is hitting this middleware
  console.log(`🛡️ Verifying JWT for: ${req.method} ${req.path}`);

  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new ApiError(500, "Server Configuration Error: Secret missing");
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
      columns: { id: true, email: true, fullName: true },
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized request: User not found");
    }

    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});