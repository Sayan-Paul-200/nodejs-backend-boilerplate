import "dotenv/config";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, sql } from "drizzle-orm";

async function grantOverride() {
  console.log("🔓 Granting Special Permissions...");

  // The Magic String: 'inventory:products:F'
  // 'inventory:products' = The Resource
  // 'F' = Hex for 15 (1111 in binary) -> Create + Read + Update + Delete

  await db.update(users)
    .set({ 
      customPermissions: sql`ARRAY['inventory:products:F']` 
    })
    .where(eq(users.email, "junior@company.com"));

  console.log("✅ Override Applied: Junior Staff now has FULL access to Products!");
  process.exit(0);
}

grantOverride().catch(err => console.error(err));