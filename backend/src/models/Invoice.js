const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: "InvProduct", default: null },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: "" },
  hsnCode:      { type: String, default: "" },
  unit:         { type: String, default: "Pcs" },
  qty:          { type: Number, required: true, min: 0 },
  rate:         { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmt:  { type: Number, default: 0 },
  taxableAmt:   { type: Number, default: 0 },
  gstRate:      { type: Number, default: 0 },
  cessRate:     { type: Number, default: 0 },
  cgstRate:     { type: Number, default: 0 },
  sgstRate:     { type: Number, default: 0 },
  igstRate:     { type: Number, default: 0 },
  cgstAmt:      { type: Number, default: 0 },
  sgstAmt:      { type: Number, default: 0 },
  igstAmt:      { type: Number, default: 0 },
  cessAmt:      { type: Number, default: 0 },
  totalTaxAmt:  { type: Number, default: 0 },
  totalAmt:     { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNo:    { type: String, required: true, unique: true, index: true },
  invoiceType:  { type: String, enum: ["invoice", "proforma", "credit_note", "debit_note", "quotation"], default: "invoice", index: true },
  status:       { type: String, enum: ["draft", "sent", "partial", "paid", "overdue", "cancelled", "void"], default: "draft", index: true },
  invoiceDate:  { type: Date, default: Date.now, index: true },
  dueDate:      { type: Date, default: null },
  deliveryDate: { type: Date, default: null },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  customerName: { type: String, required: true },
  customerGSTIN: { type: String, default: "" },
  billingAddress: {
    line1: String, line2: String, city: String, state: String,
    stateCode: String, pincode: String, country: { type: String, default: "India" }
  },
  shippingAddress: {
    line1: String, line2: String, city: String, state: String,
    stateCode: String, pincode: String, country: { type: String, default: "India" }
  },
  sameShipping: { type: Boolean, default: true },
  items:        [invoiceItemSchema],
  subtotal:     { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTaxableAmt: { type: Number, default: 0 },
  totalCGST:    { type: Number, default: 0 },
  totalSGST:    { type: Number, default: 0 },
  totalIGST:    { type: Number, default: 0 },
  totalCess:    { type: Number, default: 0 },
  totalTax:     { type: Number, default: 0 },
  roundOff:     { type: Number, default: 0 },
  grandTotal:   { type: Number, default: 0 },
  amountPaid:   { type: Number, default: 0 },
  balanceDue:   { type: Number, default: 0 },
  amountInWords: { type: String, default: "" },
  isInterState: { type: Boolean, default: false },
  supplyStateCode: { type: String, default: "" },
  currency:     { type: String, default: "INR" },
  exchangeRate: { type: Number, default: 1 },
  notes:        { type: String, default: "" },
  termsConditions: { type: String, default: "" },
  poNumber:     { type: String, default: "" },
  eWayBillNo:   { type: String, default: "" },
  template:     { type: mongoose.Schema.Types.ObjectId, ref: "InvoiceTemplate", default: null },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  sentAt:       { type: Date, default: null },
  cancelledAt:  { type: Date, default: null },
  cancelReason: { type: String, default: "" },
  pdfUrl:       { type: String, default: "" },
}, { timestamps: true });

invoiceSchema.index({ invoiceDate: -1, status: 1 });
invoiceSchema.index({ customer: 1, invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
