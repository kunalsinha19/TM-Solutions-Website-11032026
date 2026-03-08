const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const SeoPage = require("../models/SeoPage");
const slugify = require("../utils/slugify");

exports.createSeoPage = asyncHandler(async (req, res) => {
  const payload = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
  const seoPage = await SeoPage.create(payload);
  res.status(201).json({ success: true, seoPage });
});

exports.getSeoPages = asyncHandler(async (_req, res) => {
  const seoPages = await SeoPage.find().sort({ createdAt: -1 });
  res.json({ success: true, seoPages });
});

exports.getSeoPageById = asyncHandler(async (req, res) => {
  const seoPage = await SeoPage.findById(req.params.id);
  if (!seoPage) {
    throw new ApiError(404, "SEO page not found");
  }
  res.json({ success: true, seoPage });
});

exports.updateSeoPage = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.slug || payload.title) {
    payload.slug = slugify(payload.slug || payload.title);
  }

  const seoPage = await SeoPage.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!seoPage) {
    throw new ApiError(404, "SEO page not found");
  }

  res.json({ success: true, seoPage });
});

exports.deleteSeoPage = asyncHandler(async (req, res) => {
  const seoPage = await SeoPage.findByIdAndDelete(req.params.id);
  if (!seoPage) {
    throw new ApiError(404, "SEO page not found");
  }

  res.json({ success: true, message: "SEO page deleted" });
});
