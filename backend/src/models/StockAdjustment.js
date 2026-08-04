const mongoose = require("mongoose");

const adjustmentItemSchema = new mongoose.Schema({
  product:    { type: mongoose.Schema.Types.ObjectId, ref: "InvProduct", required: true },
  qtyBefore:  { type: Number, required: true },
  qtyAdjusted: { type: Number, required: true },
  qtyAfter:   { type: Number, required: true },
  reason:     { type: String, default: "" },
}, { _id: false });

const stockAdjustmentSchema = new mongoose.Schema({
  adjustmentNo: { type: String, required: true, unique: true },
  date:         { type: Date, default: Date.now, index: true },
  type:         { type: String, enum: ["increase", "decrease", "set"], required: true },
  reason:       { type: String, enum: ["damaged", "expired", "theft", "count_correction", "opening_stock", "other"], default: "other" },
  items:        [adjustmentItemSchema],
  notes:        { type: String, default: "" },
  status:       { type: String, enum: ["draft", "confirmed"], default: "confirmed", index: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

stockAdjustmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);
