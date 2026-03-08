import { Schema, model } from "mongoose";

const seoPageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    canonicalUrl: { type: String },
    ogImage: { type: String },
    schemaMarkup: { type: String },
    sections: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, default: "draft" },
    publishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

export const SeoPageModel = model("SeoPage", seoPageSchema);
