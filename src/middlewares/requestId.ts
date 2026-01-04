import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Check if client sent a specific ID (useful for tracing microservices), else generate one
  const requestId = req.headers["x-request-id"] || uuidv4();
  
  // Attach to request object for internal use
  (req as any).id = requestId;
  
  // Attach to response header so the client sees it too
  res.setHeader("x-request-id", requestId);
  
  next();
};