// Login and registration service using Drizzle ORM and bcrypt

import { db } from "../../db";
import { users } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../utils/token.utils";

export const registerUser = async (email: string, pass: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(pass, 10);
  
  const [newUser] = await db
    .insert(users)
    .values({ email, password: hashedPassword })
    .returning({ id: users.id, email: users.email });

  return newUser;
};

export const loginUser = async (email: string, pass: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(pass, user.password);
  
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email });

  // Return user info (excluding password) and the token
  const { password, ...userWithoutPassword } = user;
  
  return { user: userWithoutPassword, accessToken };
};