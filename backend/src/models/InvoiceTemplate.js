const mongoose = require("mongoose");

const invoiceTemplateSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  isDefault:  { type: Boolean, default: false, index: true },
  paperSize:  { type: String, enum: ["A4", "A5", "thermal80", "thermal58"], default: "A4" },
  orientation: { type: String, enum: ["portrait", "landscape"], default: "portrait" },
  colorScheme: {
    primary:    { type: String, default: "#1e40af" },
    secondary:  { type: String, default: "#3b82f6" },
    accent:     { type: String, default: "#f59e0b" },
    text:       { type: String, default: "#111827" },
    headerBg:   { type: String, default: "#1e40af" },
    headerText: { type: String, default: "#ffffff" },
    tableBg:    { type: String, default: "#eff6ff" },
    borderColor: { type: String, default: "#93c5fd" },
  },
  layout: {
    showLogo:        { type: Boolean, default: true },
    showSignature:   { type: Boolean, default: true },
    showWatermark:   { type: Boolean, default: false },
    showQRCode:      { type: Boolean, default: false },
    showStamp:       { type: Boolean, default: false },
    showBankDetails: { type: Boolean, default: true },
    showNotes:       { type: Boolean, default: true },
    showTerms:       { type: Boolean, default: true },
    showHSN:         { type: Boolean, default: true },
    showDiscount:    { type: Boolean, default: true },
    showTaxBreakup:  { type: Boolean, default: true },
    showAmountWords: { type: Boolean, default: true },
    showEWayBill:    { type: Boolean, default: false },
    showPONumber:    { type: Boolean, default: true },
    showShipping:    { type: Boolean, default: true },
    logoPosition:    { type: String, enum: ["left", "center", "right"], default: "left" },
    columns:         [{ type: String }],
  },
  fonts: {
    headingFamily: { type: String, default: "Helvetica-Bold" },
    bodyFamily:    { type: String, default: "Helvetica" },
    headingSize:   { type: Number, default: 12 },
    bodySize:      { type: Number, default: 9 },
  },
  customCSS:  { type: String, default: "" },
  htmlTemplate: { type: String, default: "" },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

module.exports = mongoose.model("InvoiceTemplate", invoiceTemplateSchema);
