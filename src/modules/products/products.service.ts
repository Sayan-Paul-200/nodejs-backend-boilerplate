// The Products Service (Scoped CRUD)

import { db } from "../../db";
import { products } from "../../db/schema";
import { eq, and, isNull } from "drizzle-orm";

export const createProduct = async (data: any, orgId: string) => {
  return await db.insert(products).values({
    ...data,
    organizationId: orgId, // Force the Org ID
  }).returning();
};

export const getProducts = async (orgId: string) => {
  // 🔒 SCOPED QUERY: Only fetch products for this Org
  return await db.query.products.findMany({
    where: and(
      eq(products.organizationId, orgId),
      isNull(products.deletedAt) // 👈 ONLY fetch non-deleted items
    ),
  });
};

export const deleteProduct = async (productId: string, orgId: string) => {
  // Instead of db.delete(), we update the timestamp
  const [deletedProduct] = await db
    .update(products)
    .set({ deletedAt: new Date() }) // 👈 The "Soft" Delete
    .where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
    .returning();

  return deletedProduct;
};