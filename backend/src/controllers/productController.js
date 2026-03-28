const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Product = require("../models/Product");
const slugify = require("../utils/slugify");

exports.createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body, slug: slugify(req.body.slug || req.body.name) };
  const product = await Product.create(payload);
  res.status(201).json({ success: true, product });
});

exports.getProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().populate("category").sort({ createdAt: -1 }).lean();
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ success: true, products });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category").lean();
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  res.json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.slug || payload.name) {
    payload.slug = slugify(payload.slug || payload.name);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true }).populate("category");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({ success: true, message: "Product deleted" });
});
