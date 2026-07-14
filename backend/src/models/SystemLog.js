const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema({
  level:      { type: String, enum: ["info", "warn", "error", "critical"], default: "info" },
  category:   { type: String, required: true },
  message:    { type: String, required: true },
  details:    { type: mongoose.Schema.Types.Mixed },
  stack:      { type: String },
  path:       { type: String },
  method:     { type: String },
  statusCode: { type: Number },
  ip:         { type: String },
}, { timestamps: true });

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1 });
systemLogSchema.index({ category: 1 });

module.exports = mongoose.model("SystemLog", systemLogSchema);
