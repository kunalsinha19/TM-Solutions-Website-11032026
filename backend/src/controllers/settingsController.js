const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const WebsiteSettings = require("../models/WebsiteSettings");

exports.createSettings = asyncHandler(async (req, res) => {
  const existing = await WebsiteSettings.findOne({ siteKey: "primary" });
  if (existing) {
    throw new ApiError(409, "Website settings already exist. Use update instead.");
  }

  const settings = await WebsiteSettings.create({
    siteKey: "primary",
    ...req.body
  });

  res.status(201).json({ success: true, settings });
});

exports.getSettings = asyncHandler(async (_req, res) => {
  const settings = await WebsiteSettings.findOne({ siteKey: "primary" }).lean();

  if (!settings) {
    return res.status(200).json({
      success: true,
      settings: null,
      message: "Website settings not configured yet"
    });
  }

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.json({ success: true, settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await WebsiteSettings.findOneAndUpdate(
    { siteKey: "primary" },
    { $set: req.body, $setOnInsert: { siteKey: "primary" } },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  res.json({ success: true, settings });
});

exports.updateLogo = asyncHandler(async (req, res) => {
  const { logoUrl } = req.body;

  if (!logoUrl) {
    throw new ApiError(400, "logoUrl is required");
  }

  const existing = await WebsiteSettings.findOne({ siteKey: "primary" });

  if (!existing) {
    const created = await WebsiteSettings.create({
      siteKey: "primary",
      siteName: "Tara Maa Solutions",
      logoUrl
    });

    return res.json({ success: true, settings: created });
  }

  existing.logoUrl = logoUrl;
  await existing.save();

  return res.json({ success: true, settings: existing });
});

exports.deleteSettings = asyncHandler(async (_req, res) => {
  const settings = await WebsiteSettings.findOneAndDelete({ siteKey: "primary" });

  if (!settings) {
    throw new ApiError(404, "Website settings not found");
  }

  res.json({ success: true, message: "Website settings deleted" });
});
