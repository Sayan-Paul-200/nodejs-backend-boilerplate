// The Bitmask class represents a set of permissions.

import { Action, PermissionBitmask } from "./types";

/**
 * Checks if a user's bitmask contains the required action bit.
 * Example: mask 6 (0110 - Read/Update) has READ(4)? Yes. DELETE(1)? No.
 */
export const hasBit = (userMask: PermissionBitmask, requiredAction: Action): boolean => {
  return (userMask & requiredAction) === requiredAction;
};

/**
 * Parses a Hex Override String.
 * Format: "domain:resource:HEX" (e.g., "billing:invoices:F")
 */
export const parseOverride = (
  overrides: string[] | null,
  resource: string
): PermissionBitmask | null => {
  if (!overrides) return null;

  const prefix = `${resource}:`; // e.g., "billing:invoices:"
  const match = overrides.find((perm) => perm.startsWith(prefix));

  if (!match) return null;

  // Extract last character (Hex)
  const hexChar = match.split(":").pop();
  if (!hexChar) return null;

  const mask = parseInt(hexChar, 16);
  return isNaN(mask) ? null : mask;
};