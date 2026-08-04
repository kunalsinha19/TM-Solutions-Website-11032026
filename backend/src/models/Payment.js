const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentNo:    { type: String, required: true, unique: true, index: true },
  invoice:      { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
  invoiceNo:    { type: String, required: true },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  customerName: { type: String, required: true },
  amount:       { type: Number, required: true, min: 0.01 },
  paymentDate:  { type: Date, default: Date.now, index: true },
  paymentMode:  { type: String, enum: ["cash", "bank_transfer", "upi", "cheque", "card", "neft", "rtgs", "imps", "other"], required: true },
  referenceNo:  { type: String, trim: true, default: "" },
  bankName:     { type: String, trim: true, default: "" },
  chequeNo:     { type: String, trim: true, default: "" },
  chequeDate:   { type: Date, default: null },
  notes:        { type: String, default: "" },
  status:       { type: String, enum: ["received", "pending", "bounced", "cancelled"], default: "received", index: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

paymentSchema.index({ invoice: 1, paymentDate: -1 });
paymentSchema.index({ customer: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
