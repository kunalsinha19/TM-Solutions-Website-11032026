const asyncHandler = require("../utils/asyncHandler");
const SystemLog = require("../models/SystemLog");

// GET /api/system-logs  (protected)
exports.getLogs = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip  = (page - 1) * limit;
  const { level, category } = req.query;

  const filter = {};
  if (level)    filter.level    = level;
  if (category) filter.category = category;

  const [total, logs] = await Promise.all([
    SystemLog.countDocuments(filter),
    SystemLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    success: true, logs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
