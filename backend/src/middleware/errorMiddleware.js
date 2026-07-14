const ApiError = require("../utils/apiError");

function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || 500;

  // Log 5xx errors to SystemLog (non-blocking)
  if (statusCode >= 500) {
    try {
      const SystemLog = require("../models/SystemLog");
      const ip = (String(req.headers["x-forwarded-for"] || "")).split(",")[0].trim() ||
        req.socket?.remoteAddress || "0.0.0.0";
      SystemLog.create({
        level:      "error",
        category:   "api",
        message:    error.message || "Internal server error",
        stack:      error.stack,
        path:       req.path,
        method:     req.method,
        statusCode,
        ip,
      }).catch(() => {});
    } catch {
      // never let log failure affect the response
    }
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    details: error.details || null,
  });
}

module.exports = { notFound, errorHandler };
