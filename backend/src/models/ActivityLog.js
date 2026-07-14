const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  adminId:      { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  adminName:    { type: String },
  adminEmail:   { type: String },
  action:       { type: String, required: true },
  category:     { type: String, required: true },
  details:      { type: String },
  resourceId:   { type: String },
  resourceName: { type: String },
  ip:           { type: String },
  userAgent:    { type: String },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ adminId: 1 });
activityLogSchema.index({ category: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
