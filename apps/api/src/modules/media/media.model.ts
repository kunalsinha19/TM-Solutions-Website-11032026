import { Schema, model } from "mongoose";

const mediaAssetSchema = new Schema(
  {
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    alt: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MediaAssetModel = model("MediaAsset", mediaAssetSchema);
