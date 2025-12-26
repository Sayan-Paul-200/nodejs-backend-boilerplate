// Login and registration service using Drizzle ORM and bcrypt

import { db } from "../../db";
import { users, refreshTokens } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v7 as uuidv7 } from "uuid";

// Constants for Token Expiry
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generates an Access Token and a secure, long-lived Refresh Token.
 * Stores the Refresh Token in the database.
 */
const generateTokenPair = async (userId: string) => {
  // Ensure we use the exact variable name from .env
  const secret = process.env.ACCESS_TOKEN_SECRET;
  
  if (!secret) {
    throw new Error("CRITICAL: process.env.ACCESS_TOKEN_SECRET is undefined in auth.service");
  }

  const accessToken = jwt.sign(
    { id: userId },
    secret, // <--- Using the checked variable
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshTokenStr = uuidv7();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    token: refreshTokenStr,
    expiresAt,
  });

  return { accessToken, refreshToken: refreshTokenStr };
};

export const registerUser = async (email: string, pass: string, fullName: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(pass, 10);
  const newUserId = uuidv7(); // App-side UUIDv7 generation

  // Insert User
  const [newUser] = await db
    .insert(users)
    .values({
      id: newUserId,
      email,
      fullName,
      passwordHash: hashedPassword,
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      createdAt: users.createdAt,
    });

  return newUser;
};

export const loginUser = async (email: string, pass: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const tokens = await generateTokenPair(user.id);

  // Return user info (excluding sensitive fields) and tokens
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    ...tokens,
  };
};

export const refreshUserToken = async (incomingRefreshToken: string) => {
  // 1. Find the refresh token in the DB
  const tokenRecord = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, incomingRefreshToken),
  });

  if (!tokenRecord) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // 2. Security Checks
  if (tokenRecord.revoked) {
    // Optional: Threat detection - if a revoked token is used, verify/block user
    throw new ApiError(401, "Token has been revoked");
  }

  if (new Date() > tokenRecord.expiresAt) {
    throw new ApiError(401, "Refresh token expired");
  }

  // 3. Token Rotation: Revoke the old token immediately
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, tokenRecord.id));

  // 4. Issue a new pair
  return generateTokenPair(tokenRecord.userId);
};