const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Category = require("../models/Category");
const slugify = require("../utils/slugify");
const { log } = require("../utils/activityLogger");

exports.createCategory = asyncHandler(async (req, res) => {
  const payload = { ...req.body, slug: slugify(req.body.slug || req.body.name) };
  const category = await Category.create(payload);

  setImmediate(() => log(req, {
    action: "category_created", category: "category",
    details: `Created category: ${category.name}`,
    resourceId: category._id, resourceName: category.name,
  }));

  res.status(201).json({ success: true, category });
});

exports.getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 }).lean();
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ success: true, categories });
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id).lean();
  if (!cat) throw new ApiError(404, "Category not found");
  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  res.json({ success: true, category: cat });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.slug || payload.name) {
    payload.slug = slugify(payload.slug || payload.name);
  }

  const category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!category) throw new ApiError(404, "Category not found");

  setImmediate(() => log(req, {
    action: "category_updated", category: "category",
    details: `Updated category: ${category.name}`,
    resourceId: category._id, resourceName: category.name,
  }));

  res.json({ success: true, category });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  setImmediate(() => log(req, {
    action: "category_deleted", category: "category",
    details: `Deleted category: ${category.name}`,
    resourceId: category._id, resourceName: category.name,
  }));

  res.json({ success: true, message: "Category deleted" });
});
