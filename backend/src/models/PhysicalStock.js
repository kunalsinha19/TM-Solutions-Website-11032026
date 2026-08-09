/**
 * PhysicalStock — tracks physical machine inventory across locations.
 * Mirrors the TMS spreadsheet: shippingMark, pkg/pcs, showroom/godown/transit split,
 * sold tracking. Separate from InvProduct (billing) but linkable for invoicing.
 */
const mongoose = require("mongoose");

const physicalStockSchema = new mongoose.Schema({
  sNo:          { type: Number },
  shippingMark: { type: String, required: true, trim: true, uppercase: true, unique: true }, // TMS-1, TMS-2…
  description:  { type: String, required: true, trim: true, maxlength: 300 },
  category:     { type: String, trim: true, default: "" },

  // Packaging
  pkg:          { type: Number, default: 0, min: 0 }, // number of packages received
  pcs:          { type: Number, default: 0, min: 0 }, // total units received

  // Sales
  soldPcs:      { type: Number, default: 0, min: 0 },
  soldDate:     { type: Date, default: null },

  // Location breakdown (must sum ≤ unsold)
  showroomQty:  { type: Number, default: 0, min: 0 },
  godownQty:    { type: Number, default: 0, min: 0 },
  transitQty:   { type: Number, default: 0, min: 0 },

  // Invoice system link (optional)
  invProduct:   { type: mongoose.Schema.Types.ObjectId, ref: "InvProduct", default: null },

  notes:        { type: String, default: "" },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ── Virtuals ────────────────────────────────────────────────────────────────
physicalStockSchema.virtual("unsold").get(function () {
  return Math.max(0, this.pcs - this.soldPcs);
});

physicalStockSchema.virtual("totalAvailable").get(function () {
  return (this.showroomQty || 0) + (this.godownQty || 0) + (this.transitQty || 0);
});

physicalStockSchema.virtual("status").get(function () {
  const avail = this.totalAvailable;
  const unsold = this.unsold;
  if (avail === 0 && unsold === 0) return "out_of_stock";
  if (avail === 0 && unsold > 0)   return "unallocated";   // stock not yet placed in a location
  if (this.transitQty > 0 && this.showroomQty === 0 && this.godownQty === 0) return "in_transit";
  if (avail <= 2)                   return "low_stock";
  return "in_stock";
});

// ── Indexes ──────────────────────────────────────────────────────────────────
physicalStockSchema.index({ shippingMark: 1 }, { unique: true });
physicalStockSchema.index({ description: "text", shippingMark: "text", category: "text" });
physicalStockSchema.index({ soldPcs: 1 });
physicalStockSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PhysicalStock", physicalStockSchema);
