const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true, maxlength: 180 },
    slug:           { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 220 },
    excerpt:        { type: String, default: "", maxlength: 300 },
    content:        { type: String, default: "", maxlength: 50000 },
    coverImage:     { type: String, default: "" },
    tags:           { type: [String], default: [] },
    seoTitle:       { type: String, default: "", maxlength: 70 },
    seoDescription: { type: String, default: "", maxlength: 160 },
    status:         { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt:    { type: Date, default: null },
    readingTimeMin: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ title: "text", excerpt: "text", tags: "text" });

module.exports = mongoose.model("BlogPost", blogPostSchema);
