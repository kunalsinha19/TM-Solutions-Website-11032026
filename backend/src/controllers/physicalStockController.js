const asyncHandler = require("../utils/asyncHandler");
const PhysicalStock = require("../models/PhysicalStock");
const ApiError = require("../utils/apiError");
const { log } = require("../utils/activityLogger");

// ── Helpers ──────────────────────────────────────────────────────────────────
function computeStatus(doc) {
  const avail = (doc.showroomQty || 0) + (doc.godownQty || 0) + (doc.transitQty || 0);
  const unsold = Math.max(0, (doc.pcs || 0) - (doc.soldPcs || 0));
  if (avail === 0 && unsold === 0) return "out_of_stock";
  if (avail === 0 && unsold > 0)   return "unallocated";
  if ((doc.transitQty || 0) > 0 && (doc.showroomQty || 0) === 0 && (doc.godownQty || 0) === 0) return "in_transit";
  if (avail <= 2)                   return "low_stock";
  return "in_stock";
}

// ── GET /api/physical-stock/stats ────────────────────────────────────────────
exports.getStats = asyncHandler(async (_req, res) => {
  const all = await PhysicalStock.find().lean();
  const stats = {
    total:       all.length,
    in_stock:    0,
    low_stock:   0,
    out_of_stock:0,
    in_transit:  0,
    unallocated: 0,
    totalPcs:    0,
    totalSold:   0,
    totalUnsold: 0,
  };
  for (const item of all) {
    const st = computeStatus(item);
    if (stats[st] !== undefined) stats[st]++;
    stats.totalPcs    += item.pcs || 0;
    stats.totalSold   += item.soldPcs || 0;
    stats.totalUnsold += Math.max(0, (item.pcs || 0) - (item.soldPcs || 0));
  }
  res.json({ success: true, stats });
});

// ── GET /api/physical-stock ──────────────────────────────────────────────────
exports.getAll = asyncHandler(async (req, res) => {
  const { status, category, q, page = 1, limit = 100 } = req.query;
  const filter = {};

  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;

  const all = await PhysicalStock.find(filter)
    .sort({ sNo: 1, shippingMark: 1 })
    .lean();

  // Apply status filter in-memory (computed virtual)
  const withStatus = all.map(item => ({
    ...item,
    unsold:         Math.max(0, (item.pcs || 0) - (item.soldPcs || 0)),
    totalAvailable: (item.showroomQty || 0) + (item.godownQty || 0) + (item.transitQty || 0),
    status:         computeStatus(item),
  }));

  const filtered = status ? withStatus.filter(i => i.status === status) : withStatus;

  const total   = filtered.length;
  const skip    = (Number(page) - 1) * Number(limit);
  const items   = filtered.slice(skip, skip + Number(limit));

  res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
});

// ── GET /api/physical-stock/:id ───────────────────────────────────────────────
exports.getOne = asyncHandler(async (req, res) => {
  const item = await PhysicalStock.findById(req.params.id).populate("invProduct").lean();
  if (!item) throw new ApiError(404, "Stock item not found");
  const unsold = Math.max(0, (item.pcs || 0) - (item.soldPcs || 0));
  res.json({ success: true, item: {
    ...item,
    unsold,
    totalAvailable: (item.showroomQty || 0) + (item.godownQty || 0) + (item.transitQty || 0),
    status: computeStatus(item),
  }});
});

// ── POST /api/physical-stock ─────────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
  const item = await PhysicalStock.create(req.body);
  setImmediate(() => log(req, {
    action: "stock_created", category: "inventory",
    details: `Created stock item ${item.shippingMark} — ${item.description}`,
    resourceId: item._id, resourceName: item.shippingMark,
  }));
  res.status(201).json({ success: true, item });
});

// ── PUT /api/physical-stock/:id ───────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
  const item = await PhysicalStock.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!item) throw new ApiError(404, "Stock item not found");
  setImmediate(() => log(req, {
    action: "stock_updated", category: "inventory",
    details: `Updated ${item.shippingMark} — ${item.description}`,
    resourceId: item._id, resourceName: item.shippingMark,
  }));
  res.json({ success: true, item });
});

// ── DELETE /api/physical-stock/:id ────────────────────────────────────────────
exports.remove = asyncHandler(async (req, res) => {
  const item = await PhysicalStock.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Stock item not found");
  setImmediate(() => log(req, {
    action: "stock_deleted", category: "inventory",
    details: `Deleted ${item.shippingMark} — ${item.description}`,
    resourceId: item._id, resourceName: item.shippingMark,
  }));
  res.json({ success: true, message: "Deleted" });
});

// ── POST /api/physical-stock/:id/sell ─────────────────────────────────────────
// Record a sale: increase soldPcs, set soldDate, reduce location qty
exports.recordSale = asyncHandler(async (req, res) => {
  const { qty, fromLocation = "showroom", soldDate } = req.body;
  if (!qty || qty <= 0) throw new ApiError(400, "qty must be > 0");

  const item = await PhysicalStock.findById(req.params.id);
  if (!item) throw new ApiError(404, "Stock item not found");

  const unsold = Math.max(0, item.pcs - item.soldPcs);
  if (qty > unsold) throw new ApiError(400, `Cannot sell ${qty} — only ${unsold} unsold`);

  // Deduct from specified location
  const locField = `${fromLocation}Qty`;
  if (item[locField] !== undefined) {
    if (item[locField] < qty) throw new ApiError(400, `Only ${item[locField]} units in ${fromLocation}`);
    item[locField] -= qty;
  }

  item.soldPcs  += qty;
  item.soldDate  = soldDate ? new Date(soldDate) : new Date();
  await item.save();

  setImmediate(() => log(req, {
    action: "stock_sold", category: "inventory",
    details: `Sold ${qty} unit(s) of ${item.shippingMark} from ${fromLocation}`,
    resourceId: item._id, resourceName: item.shippingMark,
  }));

  res.json({ success: true, item });
});

// ── POST /api/physical-stock/:id/move ─────────────────────────────────────────
// Move stock between locations: showroom ↔ godown ↔ transit
exports.moveStock = asyncHandler(async (req, res) => {
  const { qty, from, to } = req.body;
  if (!qty || qty <= 0)    throw new ApiError(400, "qty must be > 0");
  if (!from || !to)        throw new ApiError(400, "from and to locations required");
  if (from === to)         throw new ApiError(400, "from and to must be different");

  const validLocs = ["showroom", "godown", "transit"];
  if (!validLocs.includes(from) || !validLocs.includes(to))
    throw new ApiError(400, "Invalid location. Use: showroom, godown, transit");

  const item = await PhysicalStock.findById(req.params.id);
  if (!item) throw new ApiError(404, "Stock item not found");

  const fromField = `${from}Qty`;
  const toField   = `${to}Qty`;

  if (item[fromField] < qty) throw new ApiError(400, `Only ${item[fromField]} units in ${from}`);

  item[fromField] -= qty;
  item[toField]   += qty;
  await item.save();

  setImmediate(() => log(req, {
    action: "stock_moved", category: "inventory",
    details: `Moved ${qty} unit(s) of ${item.shippingMark} from ${from} → ${to}`,
    resourceId: item._id, resourceName: item.shippingMark,
  }));

  res.json({ success: true, item });
});

// ── POST /api/physical-stock/bulk-import ─────────────────────────────────────
// Upsert many items at once (from CSV/JSON import)
exports.bulkImport = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) throw new ApiError(400, "items array required");

  let created = 0, updated = 0, failed = 0;
  const errors = [];

  for (const row of items) {
    if (!row.shippingMark || !row.description) { failed++; errors.push(`Missing shippingMark/description`); continue; }
    try {
      const existing = await PhysicalStock.findOne({ shippingMark: row.shippingMark.trim().toUpperCase() });
      if (existing) {
        await PhysicalStock.findByIdAndUpdate(existing._id, { $set: row }, { runValidators: true });
        updated++;
      } else {
        await PhysicalStock.create(row);
        created++;
      }
    } catch (err) {
      failed++;
      errors.push(`${row.shippingMark}: ${err.message}`);
    }
  }

  setImmediate(() => log(req, {
    action: "stock_bulk_import", category: "inventory",
    details: `Bulk import: ${created} created, ${updated} updated, ${failed} failed`,
  }));

  res.json({ success: true, created, updated, failed, errors });
});

// ── GET /api/physical-stock/export ───────────────────────────────────────────
exports.exportCsv = asyncHandler(async (_req, res) => {
  const all = await PhysicalStock.find().sort({ sNo: 1 }).lean();

  const headers = ["S.No","Shipping Mark","Description","Category","PKG","PCS","Sold (Pcs)","Sold Date","Unsold","Showroom (Qty)","Godown (Qty)","Transit (Qty)","Status","Notes"];
  const rows = all.map(i => {
    const unsold = Math.max(0, (i.pcs || 0) - (i.soldPcs || 0));
    return [
      i.sNo ?? "",
      i.shippingMark,
      i.description,
      i.category || "",
      i.pkg ?? "",
      i.pcs ?? "",
      i.soldPcs ?? 0,
      i.soldDate ? new Date(i.soldDate).toLocaleDateString("en-IN") : "",
      unsold,
      i.showroomQty ?? 0,
      i.godownQty ?? 0,
      i.transitQty ?? 0,
      computeStatus(i),
      (i.notes || "").replace(/,/g, ";"),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="tms-stock-${Date.now()}.csv"`);
  res.send(csv);
});
