const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  line1:   { type: String, trim: true, default: "" },
  line2:   { type: String, trim: true, default: "" },
  city:    { type: String, trim: true, default: "" },
  state:   { type: String, trim: true, default: "" },
  stateCode: { type: String, trim: true, default: "" },
  pincode: { type: String, trim: true, default: "" },
  country: { type: String, trim: true, default: "India" },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 200 },
  displayName:  { type: String, trim: true, default: "" },
  email:        { type: String, trim: true, lowercase: true, default: "" },
  phone:        { type: String, trim: true, default: "" },
  altPhone:     { type: String, trim: true, default: "" },
  company:      { type: String, trim: true, default: "" },
  gstin:        { type: String, trim: true, uppercase: true, default: "" },
  pan:          { type: String, trim: true, uppercase: true, default: "" },
  billingAddress:  { type: addressSchema, default: () => ({}) },
  shippingAddress: { type: addressSchema, default: () => ({}) },
  sameAddress:  { type: Boolean, default: true },
  creditLimit:  { type: Number, default: 0, min: 0 },
  creditDays:   { type: Number, default: 30, min: 0 },
  openingBalance: { type: Number, default: 0 },
  balanceType:  { type: String, enum: ["debit", "credit"], default: "debit" },
  customerType: { type: String, enum: ["retail", "wholesale", "dealer", "distributor", "other"], default: "retail" },
  notes:        { type: String, default: "" },
  tags:         [{ type: String, trim: true }],
  isActive:     { type: Boolean, default: true, index: true },
  totalInvoices: { type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
  totalPaid:     { type: Number, default: 0 },
  outstandingAmount: { type: Number, default: 0 },
}, { timestamps: true });

customerSchema.index({ name: "text", company: "text", email: "text", phone: "text", gstin: "text" });
customerSchema.index({ isActive: 1, createdAt: -1 });
customerSchema.index({ gstin: 1 }, { sparse: true });

module.exports = mongoose.model("Customer", customerSchema);
