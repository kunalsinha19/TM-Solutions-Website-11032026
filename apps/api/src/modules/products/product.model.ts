import { Schema, model } from "mongoose";

const productCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ProductCategory", index: true },
    images: [{ url: String, alt: String }],
    specifications: [{ label: String, value: String }],
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false, index: true },
    status: { type: String, default: "draft", index: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    canonicalUrl: { type: String },
    ogImage: { type: String },
    schemaMarkup: { type: String },
    publishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

export const ProductCategoryModel = model("ProductCategory", productCategorySchema);
export const ProductModel = model("Product", productSchema);
