import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  return res.status(500).json({
    message: "Internal server error"
  });
}
