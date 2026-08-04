const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const PurchaseOrder = require("../models/PurchaseOrder");
const Supplier = require("../models/Supplier");
const { addPurchaseStock } = require("../services/stockService");
const { nextPoNumber } = require("../services/invoiceNumberService");
const { log } = require("../utils/activityLogger");

function calcPoTotals(items) {
  let subtotal = 0, totalTax = 0;
  const processed = items.map((item) => {
    const taxableAmt = item.rate * item.qty;
    const taxAmt = (taxableAmt * (item.gstRate || 18)) / 100;
    const totalAmt = taxableAmt + taxAmt;
    subtotal += taxableAmt;
    totalTax += taxAmt;
    return { ...item, taxableAmt: +taxableAmt.toFixed(2), taxAmt: +taxAmt.toFixed(2), totalAmt: +totalAmt.toFixed(2) };
  });
  return { items: processed, subtotal: +subtotal.toFixed(2), totalTax: +totalTax.toFixed(2), grandTotal: +(subtotal + totalTax).toFixed(2) };
}

exports.getPurchaseOrders = asyncHandler(async (req, res) => {
  const { status, supplier, from, to, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (supplier) filter.supplier = supplier;
  if (from || to) {
    filter.poDate = {};
    if (from) filter.poDate.$gte = new Date(from);
    if (to) filter.poDate.$lte = new Date(new Date(to).setHours(23, 59, 59));
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    PurchaseOrder.find(filter).sort({ poDate: -1 }).skip(skip).limit(Number(limit))
      .populate("supplier", "name phone")
      .select("-items"),
    PurchaseOrder.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getPurchaseOrderById = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id)
    .populate("supplier")
    .populate("items.product", "name sku unit")
    .populate("createdBy", "name");
  if (!order) throw new ApiError(404, "Purchase order not found");
  res.json({ success: true, order });
});

exports.createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplier: supplierId, items: rawItems = [], ...rest } = req.body;
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) throw new ApiError(404, "Supplier not found");

  const poNumber = await nextPoNumber();
  const { items, subtotal, totalTax, grandTotal } = calcPoTotals(rawItems);

  const order = await PurchaseOrder.create({
    poNumber,
    supplier: supplierId,
    supplierName: supplier.name,
    supplierGSTIN: supplier.gstin || "",
    items,
    subtotal,
    totalTax,
    grandTotal,
    createdBy: req.admin._id,
    ...rest,
  });

  setImmediate(() => log(req, {
    action: "po_created", category: "invoice",
    details: `Created PO ${poNumber} from ${supplier.name} — ₹${grandTotal}`,
    resourceId: order._id, resourceName: order.poNumber,
  }));

  res.status(201).json({ success: true, order });
});

exports.receiveOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) throw new ApiError(404, "Purchase order not found");
  if (order.status === "received") throw new ApiError(400, "Order already fully received");
  if (order.status === "cancelled") throw new ApiError(400, "Cannot receive a cancelled order");

  const receivedItems = req.body.items || order.items;

  await addPurchaseStock({
    items: receivedItems.filter(i => i.product),
    referenceType: "PurchaseOrder",
    referenceId: order._id,
    referenceNo: order.poNumber,
    adminId: req.admin._id,
  });

  order.status = "received";
  order.receivedAt = new Date();
  await order.save();

  await Supplier.findByIdAndUpdate(order.supplier, {
    $inc: { totalOrders: 1, totalAmount: order.grandTotal },
  });

  setImmediate(() => log(req, {
    action: "po_received", category: "inventory",
    details: `Received PO ${order.poNumber} from ${order.supplierName}`,
    resourceId: order._id, resourceName: order.poNumber,
  }));

  res.json({ success: true, order });
});

exports.updatePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) throw new ApiError(404, "Purchase order not found");
  if (order.status === "received") throw new ApiError(400, "Cannot edit a received order");

  const { items: rawItems, ...rest } = req.body;
  let update = rest;
  if (rawItems) {
    const { items, subtotal, totalTax, grandTotal } = calcPoTotals(rawItems);
    update = { ...rest, items, subtotal, totalTax, grandTotal };
  }

  const updated = await PurchaseOrder.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, order: updated });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: "cancelled" }, { new: true });
  if (!order) throw new ApiError(404, "Purchase order not found");
  res.json({ success: true, order });
});
