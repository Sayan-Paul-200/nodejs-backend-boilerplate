// Interceptor middleware to verify JWT tokens

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

interface JwtPayload {
  id: number;
  email: string;
}

export const verifyJWT = asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
  const token =
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.cookies?.accessToken; // Support cookies if you implement them

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    // Optional: Check DB if user still exists/is active here for extra security
    // const user = await db.query.users.findFirst({ where: eq(users.id, decoded.id) });
    // if (!user) throw new ApiError(401, "Invalid Access Token");

    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }
});