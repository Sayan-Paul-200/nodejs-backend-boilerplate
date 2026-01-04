import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse"; // 👈 Import ApiResponse
import * as productService from "./products.service";
import { logAudit } from "../system/audit.service";
import { checkProductLimit } from "../billing/billing.utils";
import { getPaginationParams, paginateResponse } from "../../utils/pagination"; // 👈 Import Pagination Utils

// Helper to get Org ID safely
const getOrgId = (req: Request) => {
  const user = req.user as any;
  if (!user?.organizationId) throw new ApiError(400, "User has no Organization");
  return user.organizationId;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  
  // 🛑 BILLING CHECK: This will throw 403 if limit exceeded
  await checkProductLimit(orgId);
  
  const result = await productService.createProduct(req.body, orgId);

  // 🕵️ AUDIT LOG: Product Created
  // We assume result[0] is the created product because of .returning()
  const createdProduct = result[0]; 

  logAudit({
    userId: (req.user as any).id,
    organizationId: orgId,
    action: "PRODUCT_CREATED",
    resource: `product:${createdProduct.id}`,
    metadata: { name: createdProduct.name, price: createdProduct.price },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json(new ApiResponse(201, result, "Product created successfully"));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);

  // 1. Get Pagination Params (page, limit)
  const { page, limit } = getPaginationParams(req.query);

  // 2. Fetch Data (Pass params to service)
  // Note: Ensure your product service is updated to accept (orgId, page, limit)
  const { data, total } = await productService.getProducts(orgId, page, limit);

  // 3. Format Response with Meta data
  const paginatedData = paginateResponse(data, total, page, limit);

  res.status(200).json(new ApiResponse(200, paginatedData, "Products fetched successfully"));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { id } = req.params;
  
  const result = await productService.deleteProduct(id, orgId);
  
  if (!result) throw new ApiError(404, "Product not found or access denied");
  
  res.status(200).json(new ApiResponse(200, { msg: "Deleted successfully" }, "Product deleted successfully"));
});