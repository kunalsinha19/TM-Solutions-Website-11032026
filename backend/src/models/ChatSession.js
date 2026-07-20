const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ["user", "bot"], required: true },
  text:      { type: String, maxlength: 800, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, unique: true, index: true },
  messages:    { type: [messageSchema], default: [], validate: { validator: v => v.length <= 60, message: "Too many messages" } },
  startedAt:   { type: Date, default: Date.now, index: true },
  lastActivityAt: { type: Date, default: Date.now, index: true },

  // Auto-extracted lead intelligence
  leadScore:          { type: Number, default: 0, min: 0, max: 100, index: true },
  leadSignals:        { type: [String], default: [] },
  productsDiscussed:  { type: [String], default: [] },
  emailCaptured:      { type: String, default: "", trim: true, lowercase: true },
  phoneCaptured:      { type: String, default: "", trim: true },
  hasQuoteRequest:    { type: Boolean, default: false, index: true },
  hasPriceInquiry:    { type: Boolean, default: false },
  hasUrgency:         { type: Boolean, default: false },
  quoteSubmitted:     { type: Boolean, default: false, index: true },

  // Visitor context
  visitorIp:  { type: String, default: "" },
  userAgent:  { type: String, default: "", maxlength: 300 },

  // TTL: auto-delete after 30 days
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

chatSessionSchema.index({ leadScore: -1, startedAt: -1 });
chatSessionSchema.index({ hasQuoteRequest: 1, startedAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
