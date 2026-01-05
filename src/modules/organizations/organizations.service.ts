import { db } from "../../db";
import { invitations, users, organizations } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { ApiError } from "../../utils/ApiError";
// import { emailService } from "../../services/email.service";
import { addEmailJob } from "../../jobs/email.queue";
import { env } from "../../config/env";

const INVITE_EXPIRY_HOURS = 48;

export const createInvitation = async (
  email: string, 
  role: "admin" | "manager" | "member" | "guest" | string,
  orgId: string, 
  inviterId: string
) => {
  // 1. Check if user already exists in the system
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existingUser) {
    throw new ApiError(409, "User already registered. Please use 'Add Member' instead.");
  }

  // 2. Check for pending duplicates
  const existingInvite = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.email, email), 
      eq(invitations.organizationId, orgId),
      eq(invitations.status, "pending")
    )
  });

  if (existingInvite) {
    throw new ApiError(409, "Invitation already pending for this email.");
  }

  // 3. Get Organization Name (For the email)
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { name: true }
  });
  if (!org) throw new ApiError(404, "Organization not found");

  // 4. Generate Token & Expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

  // 5. Save to DB
  const [invite] = await db.insert(invitations).values({
    email,
    organizationId: orgId,
    role: role as any,
    invitedBy: inviterId,
    token,
    expiresAt
  }).returning();

  // 5. Send Email via Service
  const baseUrl = env.FRONTEND_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/accept-invite?token=${token}`;
  
  // Old Way - Direct Send
  // await emailService.sendInvite(email, inviteLink, org.name);

  // 🚀 ASYNC: Push to Queue instead of sending directly
  await addEmailJob({
    type: "INVITE",
    to: email,
    payload: {
      token: token,      // Worker needs this to reconstruct link (or you can pass link directly)
      orgName: org.name
    }
  });

  return { ...invite, inviteLink };
};

export const validateInviteToken = async (token: string) => {
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with: {
      // We want to show the user WHICH org they are joining
      // Note: Requires adding 'relations' in schema (Skipping for brevity, fetching manually below)
    }
  });

  if (!invite) throw new ApiError(404, "Invalid invitation token");
  if (invite.status !== "pending") throw new ApiError(400, "Invitation already used");
  if (new Date() > invite.expiresAt) throw new ApiError(400, "Invitation expired");

  return invite;
};