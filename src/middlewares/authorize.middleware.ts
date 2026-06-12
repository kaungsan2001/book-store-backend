import type { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { ERRORS } from "../config/constants";

const roles = ["ADMIN", "AUTHOR", "USER"] as const;
type Role = (typeof roles)[number];

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: Role;
  };
}

export const authorize = (requiredRole: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role || !requiredRole.includes(role)) {
      throw createHttpError(403, "Forbidden", {
        code: ERRORS.FORBIDDEN,
        details: "You do not have permission to access this resource",
      });
    }

    next();
  };
};
