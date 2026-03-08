const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 160,
      match: /^[a-z0-9-]+$/
    },
    description: {
      type: String,
      default: "",
      maxlength: 500
    },
    seoTitle: {
      type: String,
      default: "",
      maxlength: 70
    },
    seoDescription: {
      type: String,
      default: "",
      maxlength: 160
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
categorySchema.index({ isActive: 1, seoTitle: 1 });

module.exports = mongoose.model("Category", categorySchema);
