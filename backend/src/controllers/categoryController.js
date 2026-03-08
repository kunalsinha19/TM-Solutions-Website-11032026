const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Category = require("../models/Category");
const slugify = require("../utils/slugify");

exports.createCategory = asyncHandler(async (req, res) => {
  const payload = { ...req.body, slug: slugify(req.body.slug || req.body.name) };
  const category = await Category.create(payload);
  res.status(201).json({ success: true, category });
});

exports.getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json({ success: true, categories });
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  res.json({ success: true, category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.slug || payload.name) {
    payload.slug = slugify(payload.slug || payload.name);
  }

  const category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.json({ success: true, category });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.json({ success: true, message: "Category deleted" });
});
