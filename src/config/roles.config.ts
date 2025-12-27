// "Constitution" role configuration

import { Action } from "../modules/iam/types";
import { ResourceDomain, RolePermissions } from "../modules/iam/types";

// Helper to combine bits: R | U = 6
const R = Action.READ;
const C = Action.CREATE;
const U = Action.UPDATE;
const D = Action.DELETE;

export const ROLE_RULES: Record<string, RolePermissions> = {
  admin: {
    'system:users': { default: C | R | U | D },
    'billing:invoices': { default: C | R | U | D },
    'inventory:products': { default: C | R | U | D },
    'organization:team': { default: C | R | U | D },  // Can invite & remove members
  },
  manager: {
    'system:users': { default: R }, // Can see users but not edit
    'billing:invoices': { default: R | U }, // Can read/edit, but not create/delete
    'inventory:products': { default: C | R | U | D }, // Full access to products
  },
  member: {
    'system:users': { default: 0 }, // No access
    'billing:invoices': { default: R, conditional: true }, // Can read ONLY own invoices
    'inventory:products': { default: R }, // Can read products
    'organization:team': { default: R }, // Can see coworker list
  },
  guest: {
    // defaults to 0 for everything
  }
};