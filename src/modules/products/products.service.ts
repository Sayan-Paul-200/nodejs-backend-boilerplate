// The Products Service (Scoped CRUD)

import { db } from "../../db";
import { products } from "../../db/schema";
import { count, eq, and, isNull, desc } from "drizzle-orm";

export const createProduct = async (data: any, orgId: string) => {
  return await db.insert(products).values({
    ...data,
    organizationId: orgId, // Force the Org ID
  }).returning();
};

export const getProducts = async (orgId: string, page: number, limit: number) => {
  const offset = (page - 1) * limit;

  // 1. Get Data
  const data = await db.query.products.findMany({
    where: and(eq(products.organizationId, orgId), isNull(products.deletedAt)),
    limit: limit,
    offset: offset,
    orderBy: [desc(products.createdAt)], // Show newest first
  });

  // 2. Get Total Count (Efficiently)
  const [totalResult] = await db
    .select({ count: count() })
    .from(products)
    .where(and(eq(products.organizationId, orgId), isNull(products.deletedAt)));

  return { data, total: totalResult.count };
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