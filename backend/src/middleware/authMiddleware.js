const ApiError = require("../utils/apiError");
const { verifyToken } = require("../utils/jwt");
const Admin = require("../models/Admin");

async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return next(new ApiError(401, "Authentication required"));
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    const admin = await Admin.findById(decoded.id).select("-passwordHash");

    if (!admin || !admin.isActive) {
      return next(new ApiError(401, "Invalid or inactive admin"));
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid token", error.message));
  }
}

function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.admin) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.admin.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }

    return next();
  };
}

module.exports = {
  protect,
  authorizeRoles
};
