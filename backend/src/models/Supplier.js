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

const supplierSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 200 },
  email:        { type: String, trim: true, lowercase: true, default: "" },
  phone:        { type: String, trim: true, default: "" },
  altPhone:     { type: String, trim: true, default: "" },
  company:      { type: String, trim: true, default: "" },
  gstin:        { type: String, trim: true, uppercase: true, default: "" },
  pan:          { type: String, trim: true, uppercase: true, default: "" },
  address:      { type: addressSchema, default: () => ({}) },
  bankName:     { type: String, trim: true, default: "" },
  bankAccount:  { type: String, trim: true, default: "" },
  bankIFSC:     { type: String, trim: true, uppercase: true, default: "" },
  bankBranch:   { type: String, trim: true, default: "" },
  paymentTerms: { type: Number, default: 30 },
  notes:        { type: String, default: "" },
  tags:         [{ type: String, trim: true }],
  isActive:     { type: Boolean, default: true, index: true },
  totalOrders:  { type: Number, default: 0 },
  totalAmount:  { type: Number, default: 0 },
}, { timestamps: true });

supplierSchema.index({ name: "text", company: "text", email: "text", gstin: "text" });
supplierSchema.index({ isActive: 1, createdAt: -1 });
supplierSchema.index({ gstin: 1 }, { sparse: true });

module.exports = mongoose.model("Supplier", supplierSchema);
