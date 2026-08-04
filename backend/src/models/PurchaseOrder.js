const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  product:    { type: mongoose.Schema.Types.ObjectId, ref: "InvProduct", default: null },
  name:       { type: String, required: true, trim: true },
  hsnCode:    { type: String, default: "" },
  unit:       { type: String, default: "Pcs" },
  qty:        { type: Number, required: true, min: 0 },
  rate:       { type: Number, required: true, min: 0 },
  gstRate:    { type: Number, default: 18 },
  taxableAmt: { type: Number, default: 0 },
  taxAmt:     { type: Number, default: 0 },
  totalAmt:   { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber:   { type: String, required: true, unique: true, index: true },
  status:     { type: String, enum: ["draft", "sent", "partial", "received", "cancelled"], default: "draft", index: true },
  poDate:     { type: Date, default: Date.now, index: true },
  deliveryDate: { type: Date, default: null },
  supplier:   { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
  supplierName: { type: String, required: true },
  supplierGSTIN: { type: String, default: "" },
  items:      [poItemSchema],
  subtotal:   { type: Number, default: 0 },
  totalTax:   { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes:      { type: String, default: "" },
  termsConditions: { type: String, default: "" },
  receivedAt: { type: Date, default: null },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

purchaseOrderSchema.index({ poDate: -1 });
purchaseOrderSchema.index({ supplier: 1, poDate: -1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
