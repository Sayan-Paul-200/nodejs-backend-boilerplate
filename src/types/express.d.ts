// Typescript definition (Crucial)

import { Express } from "express";

declare global {
  namespace Express {
    interface Request {
      // We attach the full user object or a minimal payload to the request
      user?: {
        id: number;
        email: string;
      };
    }
  }
}