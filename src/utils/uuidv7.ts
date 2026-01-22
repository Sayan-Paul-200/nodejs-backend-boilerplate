import crypto from "crypto";

/**
 * Generates a RFC 9562 compliant UUIDv7.
 * Uses the built-in Node.js crypto module for performance and safety.
 * Structure: unix_ts_ms (48 bits) | ver (4 bits) | rand_a (12 bits) | var (2 bits) | rand_b (62 bits)
 */
export const uuidv7 = (): string => {
  // 1. Generate 16 random bytes
  const value = new Uint8Array(16);
  crypto.getRandomValues(value);

  // 2. Get current timestamp (ms)
  const timestamp = Date.now();

  // 3. Encode timestamp into the first 48 bits (6 bytes)
  value[0] = (timestamp >> 40) & 0xff;
  value[1] = (timestamp >> 32) & 0xff;
  value[2] = (timestamp >> 24) & 0xff;
  value[3] = (timestamp >> 16) & 0xff;
  value[4] = (timestamp >> 8) & 0xff;
  value[5] = timestamp & 0xff;

  // 4. Set Version to 7 (0111)
  value[6] = (value[6] & 0x0f) | 0x70;

  // 5. Set Variant to 10xx
  value[8] = (value[8] & 0x3f) | 0x80;

  // 6. Convert to Hex String (xxxxxxxx-xxxx-7xxx-vxxx-xxxxxxxxxxxx)
  const hex = [...value].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};