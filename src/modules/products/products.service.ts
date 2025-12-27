// The Products Service (Scoped CRUD)

import { db } from "../../db";
import { products } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const createProduct = async (data: any, orgId: string) => {
  return await db.insert(products).values({
    ...data,
    organizationId: orgId, // Force the Org ID
  }).returning();
};

export const getProducts = async (orgId: string) => {
  // 🔒 SCOPED QUERY: Only fetch products for this Org
  return await db.query.products.findMany({
    where: eq(products.organizationId, orgId),
  });
};

export const deleteProduct = async (id: string, orgId: string) => {
  // 🔒 SCOPED DELETE: Ensure ID matches AND Org matches
  const [deleted] = await db
    .delete(products)
    .where(and(
      eq(products.id, id),
      eq(products.organizationId, orgId)
    ))
    .returning();
  
  return deleted;
};