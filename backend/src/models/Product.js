const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
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
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 64,
      index: true
    },
    shortDescription: {
      type: String,
      default: "",
      maxlength: 300
    },
    description: {
      type: String,
      default: "",
      maxlength: 10000
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.every((item) => typeof item === "string"),
        message: "Images must be an array of URLs"
      }
    },
    tags: {
      type: [String],
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
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
    canonicalUrl: {
      type: String,
      default: "",
      maxlength: 500
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
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

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ status: 1, slug: 1 });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, status: 1, updatedAt: -1 });
productSchema.index({ seoTitle: 1, seoDescription: 1 });
productSchema.index({ name: "text", shortDescription: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
