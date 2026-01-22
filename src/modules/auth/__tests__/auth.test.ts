// Testing the API flow ( Route -> Controller )

import request from "supertest";
import { app } from "../../../app"; // We import app, not index.ts
import { db, pool } from "../../../db";
import { users } from "../../../db/schema";
import { sql } from "drizzle-orm";

// Setup: Clean DB before running tests
beforeAll(async () => {
  // Danger: This wipes the users table! Only for test DBs.
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  // Close pool if necessary or just let Jest handle it with --forceExit
    await pool.end();
});

describe("Auth Module", () => {
  const testUser = {
    email: "test@example.com",
    password: "password123",
    fullName: "Test User"
  };

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/v1/auth/register").send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it("should fail if user already exists", async () => {
      const res = await request(app).post("/api/v1/auth/register").send(testUser);

      expect(res.statusCode).toBe(409); // Conflict
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: testUser.password
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should fail with incorrect password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
    });
  });
});