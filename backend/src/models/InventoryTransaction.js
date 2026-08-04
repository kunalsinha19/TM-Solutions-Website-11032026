const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: "InvProduct", required: true, index: true },
  type:         { type: String, required: true, enum: ["purchase", "sale", "adjustment", "return_in", "return_out", "opening", "transfer"], index: true },
  referenceType: { type: String, enum: ["Invoice", "PurchaseOrder", "StockAdjustment", "Manual", null], default: null },
  referenceId:  { type: mongoose.Schema.Types.ObjectId, default: null },
  referenceNo:  { type: String, default: "" },
  qtyBefore:    { type: Number, required: true },
  qtyChange:    { type: Number, required: true },
  qtyAfter:     { type: Number, required: true },
  unitCost:     { type: Number, default: 0 },
  totalCost:    { type: Number, default: 0 },
  notes:        { type: String, default: "" },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
inventoryTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryTransaction", inventoryTransactionSchema);
