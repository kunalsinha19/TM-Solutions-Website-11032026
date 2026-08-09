const asyncHandler = require("../utils/asyncHandler");
const QuoteRequest = require("../models/QuoteRequest");
const { validateCaptcha } = require("../services/captchaService");
const { sendQuoteRequestEmail, sendQuoteResponseEmail, buildQuoteReply } = require("../services/emailService");
const ApiError = require("../utils/apiError");
const { HAS_REAL_SMTP, HAS_RESEND, HAS_REAL_CAPTCHA } = require("../config/env");
const HAS_EMAIL = HAS_RESEND || HAS_REAL_SMTP;
const { log } = require("../utils/activityLogger");

console.log("[QuoteController] boot — HAS_EMAIL:", HAS_EMAIL, "HAS_RESEND:", HAS_RESEND, "HAS_REAL_SMTP:", HAS_REAL_SMTP);

exports.createQuoteRequest = asyncHandler(async (req, res) => {
  const { captchaToken, ...payload } = req.body;

  // Dedup: same email + message submitted within 60 seconds → return existing record
  const DEDUP_WINDOW_MS = 60_000;
  const existing = await QuoteRequest.findOne({
    email: (payload.email ?? "").toLowerCase().trim(),
    message: (payload.message ?? "").trim(),
    createdAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
  });
  if (existing) {
    return res.status(200).json({ success: true, quoteRequest: existing, duplicate: true });
  }

  const captcha = await validateCaptcha(captchaToken, req.ip);

  if (HAS_REAL_CAPTCHA && !captcha.success) {
    console.warn("Captcha failed for quote submission:", captcha.reason ?? captcha.errors);
  }

  const quoteRequest = await QuoteRequest.create({ ...payload, captchaVerified: captcha.success });
  console.log("[QuoteController] created quote id:", quoteRequest._id, "from:", payload.email, "| HAS_EMAIL:", HAS_EMAIL);

  if (HAS_EMAIL) {
    setImmediate(async () => {
      console.log("[QuoteController] sending notification email for quote:", quoteRequest._id);
      try {
        await sendQuoteRequestEmail(quoteRequest);
        console.log("[QuoteController] notification email sent ✓ for quote:", quoteRequest._id);
      } catch (error) {
        console.error("[QuoteController] notification email FAILED for quote:", quoteRequest._id, "| error:", error.message, "| code:", error.code, "| response:", error.response);
      }
    });
  } else {
    console.warn("[QuoteController] email skipped — no provider configured (HAS_RESEND:", HAS_RESEND, "HAS_REAL_SMTP:", HAS_REAL_SMTP, ")");
  }

  res.status(201).json({
    success: true,
    quoteRequest,
    notification: {
      queued: HAS_EMAIL,
      provider: HAS_RESEND ? "resend" : HAS_REAL_SMTP ? "smtp" : "none",
    }
  });
});

exports.getQuoteRequests = asyncHandler(async (_req, res) => {
  const quoteRequests = await QuoteRequest.find().populate("product").sort({ createdAt: -1 });
  res.json({ success: true, quoteRequests });
});

exports.getQuoteRequestById = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id).populate("product");
  if (!quoteRequest) throw new ApiError(404, "Quote request not found");
  res.json({ success: true, quoteRequest });
});

exports.updateQuoteRequest = asyncHandler(async (req, res) => {
  const prev = await QuoteRequest.findById(req.params.id);
  if (!prev) throw new ApiError(404, "Quote request not found");

  const quoteRequest = await QuoteRequest.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("product");

  setImmediate(() => log(req, {
    action: "quote_updated", category: "quote",
    details: `Updated quote request from ${quoteRequest.name}`,
    resourceId: quoteRequest._id, resourceName: quoteRequest.name,
    previousValue: prev.status, newValue: req.body.status || quoteRequest.status,
  }));

  res.json({ success: true, quoteRequest });
});

exports.deleteQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id);
  if (!quoteRequest) throw new ApiError(404, "Quote request not found");

  await QuoteRequest.findByIdAndDelete(req.params.id);

  setImmediate(() => log(req, {
    action: "quote_deleted", category: "quote",
    details: `Deleted quote request from ${quoteRequest.name} <${quoteRequest.email}>`,
    resourceId: quoteRequest._id, resourceName: quoteRequest.name,
  }));

  res.json({ success: true, message: "Lead deleted successfully" });
});

exports.replyToQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id).populate("product");
  if (!quoteRequest) throw new ApiError(404, "Quote request not found");

  const subject = String(req.body.subject || "").trim();
  const message = String(req.body.message || "").trim();
  if (!message) throw new ApiError(400, "Reply message is required");

  const preview = buildQuoteReply({ name: quoteRequest.name, message });

  let delivery = "draft";
  let smtpError = null;

  if (HAS_EMAIL) {
    try {
      await sendQuoteResponseEmail({ to: quoteRequest.email, name: quoteRequest.name, subject, message });
      delivery = "sent";
    } catch (err) {
      delivery = "failed";
      smtpError = err?.message || "Unknown email error";
      console.error("[Email] Reply delivery failed:", smtpError);
    }
  }

  quoteRequest.replySubject  = subject || preview.subject;
  quoteRequest.replyMessage  = message;
  quoteRequest.repliedAt     = new Date();
  quoteRequest.status        = "reviewed";
  await quoteRequest.save();

  setImmediate(() => log(req, {
    action: "quote_replied", category: "quote",
    details: `Replied to quote request from ${quoteRequest.name} (delivery: ${delivery})`,
    resourceId: quoteRequest._id, resourceName: quoteRequest.name,
  }));

  res.json({
    success: true, delivery, quoteRequest, smtpError,
    mailto: `mailto:${encodeURIComponent(quoteRequest.email)}?subject=${encodeURIComponent(subject || preview.subject)}&body=${encodeURIComponent(preview.text)}`,
  });
});
