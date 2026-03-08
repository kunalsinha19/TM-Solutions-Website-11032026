import { Schema, model } from "mongoose";

const quoteRequestSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    message: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    sourcePage: { type: String },
    captchaVerified: { type: Boolean, default: false },
    status: { type: String, default: "new", index: true },
    notes: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

quoteRequestSchema.index({ createdAt: -1 });

export const QuoteRequestModel = model("QuoteRequest", quoteRequestSchema);
