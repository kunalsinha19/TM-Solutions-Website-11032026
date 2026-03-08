const mongoose = require("mongoose");

const seoPageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 220,
      match: /^[a-z0-9-]+$/
    },
    metaTitle: {
      type: String,
      default: "",
      maxlength: 70
    },
    metaDescription: {
      type: String,
      default: "",
      maxlength: 160
    },
    canonicalUrl: {
      type: String,
      default: "",
      maxlength: 500
    },
    schemaMarkup: {
      type: String,
      default: "",
      maxlength: 50000
    },
    ogImage: {
      type: String,
      default: "",
      maxlength: 500
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

seoPageSchema.index({ slug: 1 }, { unique: true });
seoPageSchema.index({ status: 1, slug: 1 });
seoPageSchema.index({ status: 1, updatedAt: -1 });
seoPageSchema.index({ metaTitle: 1, metaDescription: 1 });
seoPageSchema.index({ title: "text", metaTitle: "text", metaDescription: "text" });

module.exports = mongoose.model("SeoPage", seoPageSchema);
