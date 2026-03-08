import { Schema, model } from "mongoose";

const otpCodeSchema = new Schema(
  {
    target: { type: String, required: true },
    purpose: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    consumedAt: { type: Date, default: null },
    attemptCount: { type: Number, default: 0 },
    ip: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const adminSessionSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const OtpCodeModel = model("OtpCode", otpCodeSchema);
export const AdminSessionModel = model("AdminSession", adminSessionSchema);
