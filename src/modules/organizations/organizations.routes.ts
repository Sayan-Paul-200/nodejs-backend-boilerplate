import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize";
import { Action } from "../iam/types";
import { inviteMember } from "./organizations.controller";

const router = Router();

router.use(verifyJWT);

// Only Admins (with 'C' permission on 'organization:team') can invite
router.post(
  "/invite", 
  authorize("organization:team", Action.CREATE), 
  inviteMember
);

export default router;