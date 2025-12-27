import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as productService from "./products.service";

// Helper to get Org ID safely
const getOrgId = (req: Request) => {
  const user = req.user as any;
  if (!user?.organizationId) throw new ApiError(400, "User has no Organization");
  return user.organizationId;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const result = await productService.createProduct(req.body, orgId);
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