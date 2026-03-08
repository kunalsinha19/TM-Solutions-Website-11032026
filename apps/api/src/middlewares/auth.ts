import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  try {
    const token = header.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (payload.type !== "access") {
      throw new ApiError(401, "Invalid token");
    }

    req.auth = payload;
    return next();
  } catch {
    return next(new ApiError(401, "Invalid token"));
  }
}
