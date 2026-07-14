const asyncHandler = require("../utils/asyncHandler");
const QuoteRequest = require("../models/QuoteRequest");
const { validateCaptcha } = require("../services/captchaService");
const { sendQuoteRequestEmail, sendQuoteResponseEmail, buildQuoteReply } = require("../services/emailService");
const ApiError = require("../utils/apiError");
const { HAS_REAL_SMTP, HAS_REAL_CAPTCHA } = require("../config/env");
const { log } = require("../utils/activityLogger");

exports.createQuoteRequest = asyncHandler(async (req, res) => {
  const { captchaToken, ...payload } = req.body;

  const captcha = await validateCaptcha(captchaToken, req.ip);

  if (HAS_REAL_CAPTCHA && !captcha.success) {
    console.warn("Captcha failed for quote submission:", captcha.reason ?? captcha.errors);
  }

  const quoteRequest = await QuoteRequest.create({ ...payload, captchaVerified: captcha.success });

  if (HAS_REAL_SMTP) {
    setImmediate(async () => {
      try { await sendQuoteRequestEmail(quoteRequest); }
      catch (error) { console.error("Quote email failed:", error.message); }
    });
  }

  res.status(201).json({ success: true, quoteRequest, notification: { sent: false, reason: "smtp-not-configured" } });
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

exports.replyToQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id).populate("product");
  if (!quoteRequest) throw new ApiError(404, "Quote request not found");

  const subject = String(req.body.subject || "").trim();
  const message = String(req.body.message || "").trim();
  if (!message) throw new ApiError(400, "Reply message is required");

  const preview = buildQuoteReply({ name: quoteRequest.name, message });

  let delivery = "draft";
  let smtpError = null;

  if (HAS_REAL_SMTP) {
    try {
      await sendQuoteResponseEmail({ to: quoteRequest.email, name: quoteRequest.name, subject, message });
      delivery = "sent";
    } catch (err) {
      delivery = "failed";
      smtpError = err?.message || "Unknown SMTP error";
      console.error("[SMTP] Reply delivery failed:", smtpError);
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
