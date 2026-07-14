const mongoose = require("mongoose");

const brochureSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  description:      { type: String, trim: true },
  category:         { type: String, trim: true },
  fileUrl:          { type: String },
  fileName:         { type: String },
  fileSize:         { type: Number },
  downloadCount:    { type: Number, default: 0 },
  lastDownloadedAt: { type: Date },
  createdByName:    { type: String },
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

brochureSchema.index({ createdAt: -1 });
brochureSchema.index({ category: 1 });

module.exports = mongoose.model("Brochure", brochureSchema);
