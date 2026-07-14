const asyncHandler = require("../utils/asyncHandler");
const ActivityLog = require("../models/ActivityLog");

// GET /api/activity-logs  (protected)
exports.getLogs = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip  = (page - 1) * limit;
  const { category, adminId } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (adminId)  filter.adminId  = adminId;

  const [total, logs] = await Promise.all([
    ActivityLog.countDocuments(filter),
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    success: true, logs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
