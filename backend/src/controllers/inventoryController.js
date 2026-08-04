const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const StockAdjustment = require("../models/StockAdjustment");
const InventoryTransaction = require("../models/InventoryTransaction");
const { adjustStock } = require("../services/stockService");
const { nextAdjustmentNumber } = require("../services/invoiceNumberService");
const { log } = require("../utils/activityLogger");

exports.getTransactions = asyncHandler(async (req, res) => {
  const { product, type, from, to, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (product) filter.product = product;
  if (type) filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    InventoryTransaction.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("product", "name sku unit")
      .populate("createdBy", "name"),
    InventoryTransaction.countDocuments(filter),
  ]);
  res.json({ success: true, transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getProductTransactions = asyncHandler(async (req, res) => {
  const transactions = await InventoryTransaction.find({ product: req.params.productId })
    .sort({ createdAt: -1 }).limit(100)
    .populate("createdBy", "name");
  res.json({ success: true, transactions });
});

exports.getAdjustments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [adjustments, total] = await Promise.all([
    StockAdjustment.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name"),
    StockAdjustment.countDocuments(),
  ]);
  res.json({ success: true, adjustments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.createAdjustment = asyncHandler(async (req, res) => {
  const { type, reason, items, notes } = req.body;
  if (!items || !items.length) throw new ApiError(400, "Items are required");

  const adjustmentNo = await nextAdjustmentNumber();

  const processedItems = [];
  for (const item of items) {
    const result = await adjustStock({
      productId: item.product,
      type,
      qty: item.qty,
      reason,
      referenceType: "StockAdjustment",
      referenceNo: adjustmentNo,
      adminId: req.admin._id,
    });
    processedItems.push({
      product: item.product,
      qtyBefore: result.qtyBefore,
      qtyAdjusted: result.qtyChange,
      qtyAfter: result.qtyAfter,
      reason: item.reason || reason || "",
    });
  }

  const adjustment = await StockAdjustment.create({
    adjustmentNo,
    type,
    reason: reason || "other",
    items: processedItems,
    notes: notes || "",
    status: "confirmed",
    createdBy: req.admin._id,
  });

  await StockAdjustment.updateOne({ _id: adjustment._id }, {
    $set: { "items.$[].referenceId": adjustment._id },
  });

  setImmediate(() => log(req, {
    action: "stock_adjusted", category: "inventory",
    details: `Stock adjustment ${adjustmentNo}: ${items.length} item(s), type: ${type}`,
    resourceId: adjustment._id, resourceName: adjustmentNo,
  }));

  res.status(201).json({ success: true, adjustment });
});
