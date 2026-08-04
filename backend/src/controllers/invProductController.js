const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const InvProduct = require("../models/InvProduct");
const InventoryTransaction = require("../models/InventoryTransaction");
const { log } = require("../utils/activityLogger");

exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, active, lowStock, page = 1, limit = 100 } = req.query;
  const filter = {};
  if (active !== undefined) filter.isActive = active === "true";
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };
  if (lowStock === "true") filter.$expr = { $lte: ["$stockQty", "$minStockQty"] };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    InvProduct.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)).populate("supplier", "name"),
    InvProduct.countDocuments(filter),
  ]);
  res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await InvProduct.findById(req.params.id).populate("supplier", "name phone");
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, product });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await InvProduct.create(req.body);

  if (product.openingStock > 0) {
    await InventoryTransaction.create({
      product: product._id,
      type: "opening",
      referenceType: "Manual",
      qtyBefore: 0,
      qtyChange: product.openingStock,
      qtyAfter: product.openingStock,
      unitCost: product.purchasePrice || 0,
      totalCost: (product.purchasePrice || 0) * product.openingStock,
      notes: "Opening stock",
      createdBy: req.admin._id,
    });
  }

  setImmediate(() => log(req, {
    action: "inv_product_created", category: "inventory",
    details: `Created product: ${product.name} (SKU: ${product.sku || "N/A"})`,
    resourceId: product._id, resourceName: product.name,
  }));
  res.status(201).json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await InvProduct.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, "Product not found");
  setImmediate(() => log(req, {
    action: "inv_product_updated", category: "inventory",
    details: `Updated product: ${product.name}`,
    resourceId: product._id, resourceName: product.name,
  }));
  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await InvProduct.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  setImmediate(() => log(req, {
    action: "inv_product_deleted", category: "inventory",
    details: `Deleted product: ${product.name}`,
    resourceId: product._id, resourceName: product.name,
  }));
  res.json({ success: true, message: "Product deleted" });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await InvProduct.distinct("category", { isActive: true, category: { $ne: "" } });
  res.json({ success: true, categories: categories.sort() });
});

exports.getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await InvProduct.find({
    isActive: true,
    isService: false,
    $expr: { $lte: ["$stockQty", "$minStockQty"] },
  }).sort({ stockQty: 1 }).limit(50);
  res.json({ success: true, products });
});
