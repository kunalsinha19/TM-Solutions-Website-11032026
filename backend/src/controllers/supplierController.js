const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Supplier = require("../models/Supplier");
const { log } = require("../utils/activityLogger");

exports.getSuppliers = asyncHandler(async (req, res) => {
  const { search, active, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (active !== undefined) filter.isActive = active === "true";
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(filter),
  ]);
  res.json({ success: true, suppliers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, "Supplier not found");
  res.json({ success: true, supplier });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  setImmediate(() => log(req, {
    action: "supplier_created", category: "invoice",
    details: `Created supplier: ${supplier.name}`,
    resourceId: supplier._id, resourceName: supplier.name,
  }));
  res.status(201).json({ success: true, supplier });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) throw new ApiError(404, "Supplier not found");
  setImmediate(() => log(req, {
    action: "supplier_updated", category: "invoice",
    details: `Updated supplier: ${supplier.name}`,
    resourceId: supplier._id, resourceName: supplier.name,
  }));
  res.json({ success: true, supplier });
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) throw new ApiError(404, "Supplier not found");
  setImmediate(() => log(req, {
    action: "supplier_deleted", category: "invoice",
    details: `Deleted supplier: ${supplier.name}`,
    resourceId: supplier._id, resourceName: supplier.name,
  }));
  res.json({ success: true, message: "Supplier deleted" });
});
