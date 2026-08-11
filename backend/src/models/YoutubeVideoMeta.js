const mongoose = require("mongoose");

/**
 * Persists admin-assigned metadata for individual YouTube Shorts.
 * Currently stores category assignment (null = "None / uncategorised").
 * Future: pinned, featured, custom description, etc.
 */
const youtubeVideoMetaSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    // null  → not assigned to any category
    // ObjectId → assigned to a specific Category document
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("YoutubeVideoMeta", youtubeVideoMetaSchema);
