const mongoose = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: emailRegex,
      index: true
    },
    backupEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: emailRegex,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 20
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    lastLoginAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

adminSchema.index({ email: 1, isActive: 1 });
adminSchema.index({ backupEmail: 1, isActive: 1 });

module.exports = mongoose.model("Admin", adminSchema);
