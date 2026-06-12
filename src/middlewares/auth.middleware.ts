import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { ERRORS } from "../config/constants";
import { verifyAccessToken } from "../utils/token";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "ADMIN" | "AUTHOR" | "USER";
  };
}

export const auth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const access_token = req.cookies ? req.cookies.access_token : null;

  if (!access_token) {
    throw createError(401, "Unauthorized", {
      code: ERRORS.ACCESS_TOKEN_MISSING,
    });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(access_token);
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw createError(401, "Unauthorized", {
        code: ERRORS.ACCESS_TOKEN_EXPIRED,
      });
    }

    if (error.name === "JsonWebTokenError") {
      throw createError(401, "Unauthorized", {
        code: ERRORS.UNAUTHORIZED,
      });
    }

    throw createError(500, "Unauthorized", {
      code: ERRORS.INTERNAL_SERVER_ERROR,
    });
  }

  req.user = { id: decoded.userId, role: decoded.role };

  next();
};
