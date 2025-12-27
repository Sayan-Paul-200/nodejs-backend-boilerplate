import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as orgService from "./organizations.service";

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const user = req.user as any;

  // Logic: Invite to MY organization
  const result = await orgService.createInvitation(
    email, 
    role || "member", 
    user.organizationId, 
    user.id
  );

  res.status(201).json({ 
    success: true, 
    message: "Invitation created", 
    // In production, NEVER return this. Send it via email.
    // We return it here for testing convenience.
    debugLink: result.inviteLink 
  });
});