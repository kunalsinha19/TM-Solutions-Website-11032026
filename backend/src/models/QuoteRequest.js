const mongoose = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const quoteRequestSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
      match: emailRegex,
      index: true
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30
    },
    company: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true
    },
    sourcePage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
      index: true
    },
    captchaVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "closed"],
      default: "new",
      index: true
    },
    replySubject: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200
    },
    replyMessage: {
      type: String,
      default: "",
      maxlength: 5000
    },
    repliedAt: {
      type: Date,
      default: null,
      index: true
    },
    source: {
      type: String,
      enum: ["form", "chat"],
      default: "form",
      index: true
    },
    chatTranscript: {
      type: [{
        role: { type: String, enum: ["user", "bot"] },
        text: { type: String, maxlength: 600 },
      }],
      default: [],
      validate: {
        validator: (v) => v.length <= 30,
        message: "Chat transcript too long",
      },
    }
  },
  { timestamps: true }
);

quoteRequestSchema.index({ status: 1, createdAt: -1 });
quoteRequestSchema.index({ product: 1, createdAt: -1 });
quoteRequestSchema.index({ email: 1, createdAt: -1 });
quoteRequestSchema.index({ sourcePage: 1, createdAt: -1 });

module.exports = mongoose.model("QuoteRequest", quoteRequestSchema);
