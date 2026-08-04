const mongoose = require("mongoose");

const invProductSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 300 },
  sku:          { type: String, trim: true, uppercase: true, default: "" },
  barcode:      { type: String, trim: true, default: "" },
  description:  { type: String, default: "" },
  category:     { type: String, trim: true, default: "" },
  brand:        { type: String, trim: true, default: "" },
  unit:         { type: String, trim: true, default: "Pcs", enum: ["Pcs", "Kg", "Gm", "L", "Ml", "Mtr", "Ft", "Box", "Set", "Pair", "Roll", "Sheet", "Bag", "Ton", "Other"] },
  customUnit:   { type: String, trim: true, default: "" },
  hsnCode:      { type: String, trim: true, default: "" },
  gstRate:      { type: Number, default: 18, enum: [0, 5, 12, 18, 28] },
  cessRate:     { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0, min: 0 },
  sellingPrice:  { type: Number, default: 0, min: 0 },
  mrp:           { type: Number, default: 0, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  stockQty:     { type: Number, default: 0 },
  minStockQty:  { type: Number, default: 0 },
  maxStockQty:  { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  location:     { type: String, trim: true, default: "" },
  imageUrl:     { type: String, default: "" },
  isActive:     { type: Boolean, default: true, index: true },
  isTaxable:    { type: Boolean, default: true },
  isService:    { type: Boolean, default: false },
  notes:        { type: String, default: "" },
  tags:         [{ type: String, trim: true }],
  supplier:     { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
}, { timestamps: true });

invProductSchema.index({ name: "text", sku: "text", barcode: "text", description: "text" });
invProductSchema.index({ isActive: 1, category: 1 });
invProductSchema.index({ sku: 1 }, { sparse: true });
invProductSchema.index({ hsnCode: 1 }, { sparse: true });
invProductSchema.index({ stockQty: 1, minStockQty: 1 });

module.exports = mongoose.model("InvProduct", invProductSchema);
