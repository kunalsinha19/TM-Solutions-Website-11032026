const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Brochure = require("../models/Brochure");
const { log } = require("../utils/activityLogger");

// GET /api/brochures  (public)
exports.getBrochures = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;
  const filter = activeOnly === "false" ? {} : { isActive: true };
  const brochures = await Brochure.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ success: true, brochures });
});

// GET /api/brochures/:id  (public)
exports.getBrochure = asyncHandler(async (req, res) => {
  const brochure = await Brochure.findById(req.params.id).lean();
  if (!brochure) throw new ApiError(404, "Brochure not found");
  res.json({ success: true, brochure });
});

// POST /api/brochures  (protected)
exports.createBrochure = asyncHandler(async (req, res) => {
  const { title, description, category, fileUrl, fileName, fileSize } = req.body;
  if (!title) throw new ApiError(400, "Title is required");

  const brochure = await Brochure.create({
    title, description, category,
    fileUrl, fileName, fileSize,
    createdBy:     req.admin._id,
    createdByName: req.admin.name,
  });

  await log(req, {
    action:       "brochure_created",
    category:     "brochure",
    details:      `Created brochure: ${title}`,
    resourceId:   brochure._id,
    resourceName: title,
  });

  res.status(201).json({ success: true, brochure });
});

// PUT /api/brochures/:id  (protected)
exports.updateBrochure = asyncHandler(async (req, res) => {
  const brochure = await Brochure.findById(req.params.id);
  if (!brochure) throw new ApiError(404, "Brochure not found");

  const fields = ["title", "description", "category", "fileUrl", "fileName", "fileSize", "isActive"];
  fields.forEach(f => { if (req.body[f] !== undefined) brochure[f] = req.body[f]; });
  await brochure.save();

  await log(req, {
    action:       "brochure_updated",
    category:     "brochure",
    details:      `Updated brochure: ${brochure.title}`,
    resourceId:   brochure._id,
    resourceName: brochure.title,
  });

  res.json({ success: true, brochure });
});

// DELETE /api/brochures/:id  (protected)
exports.deleteBrochure = asyncHandler(async (req, res) => {
  const brochure = await Brochure.findByIdAndDelete(req.params.id);
  if (!brochure) throw new ApiError(404, "Brochure not found");

  await log(req, {
    action:       "brochure_deleted",
    category:     "brochure",
    details:      `Deleted brochure: ${brochure.title}`,
    resourceId:   brochure._id,
    resourceName: brochure.title,
  });

  res.json({ success: true, message: "Brochure deleted" });
});

// POST /api/brochures/:id/download  (public — called when someone downloads)
exports.trackDownload = asyncHandler(async (req, res) => {
  const brochure = await Brochure.findById(req.params.id);
  if (!brochure) throw new ApiError(404, "Brochure not found");

  brochure.downloadCount   += 1;
  brochure.lastDownloadedAt = new Date();
  await brochure.save();

  res.json({ success: true, fileUrl: brochure.fileUrl });
});
