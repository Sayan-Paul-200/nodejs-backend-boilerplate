// Middleware to enforce the 3-layer check logic

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { Action, ResourceDomain } from "../modules/iam/types";
import { ROLE_RULES } from "../config/roles.config";
import { hasBit, parseOverride } from "../modules/iam/permissions";

/**
 * @param resource - The resource being accessed (e.g., 'inventory:products')
 * @param requiredAction - The action bit required (e.g., Action.CREATE)
 */
export const authorize = (resource: ResourceDomain, requiredAction: Action) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { role, customPermissions } = req.user as any; 
    // (Note: Update Express.Request type definition to include these fields)

    // ================================================
    // LAYER 1: CHECK OVERRIDES (The "Hex" System)
    // ================================================
    const overrideMask = parseOverride(customPermissions, resource);
    
    if (overrideMask !== null) {
      if (hasBit(overrideMask, requiredAction)) {
        return next(); // Override allows it
      } else {
        return next(new ApiError(403, "Access Denied by explicit restriction"));
      }
    }

    // ================================================
    // LAYER 2: CHECK ROLE DEFAULTS
    // ================================================
    const roleConfig = ROLE_RULES[role];
    if (!roleConfig) {
      return next(new ApiError(403, "Role configuration not found"));
    }

    const resourceRules = roleConfig[resource];
    const defaultMask = resourceRules?.default || 0; // Default to 0 (Deny)

    // ================================================
    // LAYER 3: EVALUATE & CONDITIONAL CHECK
    // ================================================
    const isAllowed = hasBit(defaultMask, requiredAction);

    if (!isAllowed) {
      return next(new ApiError(403, "Insufficient Permissions"));
    }

    // Handle "Conditional" (Ownership) Logic
    if (resourceRules?.conditional) {
      // We flag this request so the Controller knows to enforce ownership.
      // Or, if we have the ID in params, we could check here (harder in generic middleware).
      // For this v1.0.2, we pass a flag to the request object.
      (req as any).permissionFlags = { isOwnerCheckRequired: true };
    }

    next();
  };
};