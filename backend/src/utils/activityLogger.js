const ActivityLog = require("../models/ActivityLog");

function getIp(req) {
  return (String(req.headers["x-forwarded-for"] || "")).split(",")[0].trim() ||
    req.socket?.remoteAddress || "0.0.0.0";
}

async function log(req, { action, category, details, resourceId, resourceName } = {}) {
  try {
    const admin = req.admin;
    await ActivityLog.create({
      adminId:      admin?._id,
      adminName:    admin?.name,
      adminEmail:   admin?.email,
      action,
      category,
      details,
      resourceId:   resourceId ? String(resourceId) : undefined,
      resourceName,
      ip:           getIp(req),
      userAgent:    req.headers["user-agent"],
    });
  } catch (err) {
    console.error("[ActivityLog] write failed:", err.message);
  }
}

module.exports = { log, getIp };
