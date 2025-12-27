import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as productService from "./products.service";
import { logAudit } from "../system/audit.service";

// Helper to get Org ID safely
const getOrgId = (req: Request) => {
  const user = req.user as any;
  if (!user?.organizationId) throw new ApiError(400, "User has no Organization");
  return user.organizationId;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const result = await productService.createProduct(req.body, orgId);

  // 🕵️ AUDIT LOG: Product Created
  // We assume result[0] is the created product because of .returning()
  const createdProduct = result[0]; 

  logAudit({
    userId: req.user!.id,
    organizationId: orgId,
    action: "PRODUCT_CREATED",
    resource: `product:${createdProduct.id}`,
    metadata: { name: createdProduct.name, price: createdProduct.price },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({ success: true, data: result });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const result = await productService.getProducts(orgId);
  res.status(200).json({ success: true, data: result });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { id } = req.params;
  
  const result = await productService.deleteProduct(id, orgId);
  
  if (!result) throw new ApiError(404, "Product not found or access denied");
  
  res.status(200).json({ success: true, msg: "Deleted successfully" });
});