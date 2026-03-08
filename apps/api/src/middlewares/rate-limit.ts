import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(max: number, windowMs: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return next(new ApiError(429, "Too many requests"));
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
}
