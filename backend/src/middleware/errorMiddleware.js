const ApiError = require("../utils/apiError");

function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    details: error.details || null
  });
}

module.exports = {
  notFound,
  errorHandler
};
