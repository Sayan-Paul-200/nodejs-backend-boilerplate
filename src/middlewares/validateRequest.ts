// Validate Request Middleware

import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError, ZodIssue } from "zod";
import { ApiError } from "../utils/ApiError";

export const validateRequest = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // 1. Cast to ZodError to access properties safely
        const zodError = error as ZodError;

        // 2. Use .issues instead of .errors (safer for TS inference)
        // 3. Explicitly type 'issue' as ZodIssue
        const errorMessages = zodError.issues.map((issue: ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        next(new ApiError(400, "Validation Error", errorMessages));
      } else {
        next(error);
      }
    }
  };
};