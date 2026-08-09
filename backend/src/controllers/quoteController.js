const asyncHandler = require("../utils/asyncHandler");
const QuoteRequest = require("../models/QuoteRequest");
const { validateCaptcha } = require("../services/captchaService");
const { sendQuoteRequestEmail, sendCustomerAck, sendQuoteResponseEmail, buildQuoteReply } = require("../services/emailService");
const ApiError = require("../utils/apiError");
const { HAS_REAL_SMTP, HAS_RESEND, HAS_REAL_CAPTCHA } = require("../config/env");
const HAS_EMAIL = HAS_RESEND || HAS_REAL_SMTP;
const { log } = require("../utils/activityLogger");

console.log("[QuoteController] boot — HAS_EMAIL:", HAS_EMAIL, "HAS_RESEND:", HAS_RESEND, "HAS_REAL_SMTP:", HAS_REAL_SMTP);

exports.createQuoteRequest = asyncHandler(async (req, res) => {
  const { captchaToken, ...payload } = req.body;

  // Dedup: same email + message submitted within 5 minutes → return existing record
  // This prevents double-submissions from network retries, chatbot re-fires, or accidental
  // form resubmits without blocking a customer's genuinely new enquiry (different message).
  const DEDUP_WINDOW_MS = 5 * 60_000; // 5 minutes
  const normalizedEmail = (payload.email ?? "").toLowerCase().trim();
  const normalizedMessage = (payload.message ?? "").trim();
  const existing = await QuoteRequest.findOne({
    email: normalizedEmail,
    message: normalizedMessage,
    createdAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
  });
  if (existing) {
    console.log("[QuoteController] duplicate quote suppressed for:", normalizedEmail, "| original id:", existing._id);
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
      // Fire both emails concurrently; each failure is isolated so one doesn't block the other.
      const [adminResult, ackResult] = await Promise.allSettled([
        sendQuoteRequestEmail(quoteRequest),
        sendCustomerAck(quoteRequest),
      ]);

      if (adminResult.status === "fulfilled") {
        console.log("[QuoteController] admin notification sent ✓ for quote:", quoteRequest._id);
      } else {
        console.error("[QuoteController] admin notification FAILED for quote:", quoteRequest._id,
          "| error:", adminResult.reason?.message, "| code:", adminResult.reason?.code);
      }

      if (ackResult.status === "fulfilled") {
        console.log("[QuoteController] customer ack sent ✓ for quote:", quoteRequest._id, "→", quoteRequest.email);
      } else {
        console.error("[QuoteController] customer ack FAILED for quote:", quoteRequest._id,
          "| error:", ackResult.reason?.message);
      }
    });
  } else {
    console.warn("[QuoteController] emails skipped — no provider configured (HAS_RESEND:", HAS_RESEND, "HAS_REAL_SMTP:", HAS_REAL_SMTP, ")");
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
