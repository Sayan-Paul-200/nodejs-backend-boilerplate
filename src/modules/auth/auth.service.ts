// Login and registration service using Drizzle ORM and bcrypt

import { db } from "../../db";
import { users, refreshTokens, organizations } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v7 as uuidv7 } from "uuid";
import { invitations } from "../../db/schema";

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

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: `${fullName}'s Workspace`, // Default name
    })
    .returning();

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
      organizationId: newOrg.id, // <--- LINKING TENANT
      role: "admin", // First user is always Admin
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      organizationId: users.organizationId,
      role: users.role,
      createdAt: users.createdAt,
    });

  return newUser;
};

export const loginUser = async (email: string, pass: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      // Drizzle Relation: We need to fetch the Org details too
      // (Ensure you have relations defined in schema, OR just do a separate query)
    }
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  let orgPlan = "free";
  if (user.organizationId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
      columns: { plan: true }
    });
    if (org) orgPlan = org.plan;
  }

  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const tokens = await generateTokenPair(user.id);

  // Return user info (excluding sensitive fields) and tokens
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: user.organizationId,
      role: user.role,
      plan: orgPlan,
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

export const registerViaInvite = async (token: string, fullName: string, password: string) => {
  // 1. Validate Token
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.token, token)
  });

  if (!invite || invite.status !== 'pending' || new Date() > invite.expiresAt) {
    throw new ApiError(400, "Invalid or expired invite token");
  }

  // 2. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUserId = uuidv7();

  // 3. Create User (Linked to Org from Invite)
  const [newUser] = await db.insert(users).values({
    id: newUserId,
    email: invite.email,
    fullName,
    passwordHash: hashedPassword,
    organizationId: invite.organizationId, // <--- THE MAGIC LINK
    role: invite.role, // Use role from invite
    status: 'active'
  }).returning();

  // 4. Mark Invite as Accepted
  await db.update(invitations)
    .set({ status: 'accepted' })
    .where(eq(invitations.id, invite.id));

  return newUser;
};