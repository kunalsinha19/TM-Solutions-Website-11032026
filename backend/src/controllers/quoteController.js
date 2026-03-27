const asyncHandler = require("../utils/asyncHandler");
const QuoteRequest = require("../models/QuoteRequest");
const { validateCaptcha } = require("../services/captchaService");
const { sendQuoteRequestEmail, sendQuoteResponseEmail, buildQuoteReply } = require("../services/emailService");
const ApiError = require("../utils/apiError");
const { HAS_REAL_SMTP } = require("../config/env");

exports.createQuoteRequest = asyncHandler(async (req, res) => {
  const { captchaToken, ...payload } = req.body;

  const captcha = await validateCaptcha(captchaToken, req.ip);

  if (!captcha.success) {
    throw new ApiError(400, "Captcha validation failed", captcha);
  }

  const quoteRequest = await QuoteRequest.create({
    ...payload,
    captchaVerified: true
  });

  const notification = { sent: false, reason: "smtp-not-configured" };

  if (HAS_REAL_SMTP) {
    setImmediate(async () => {
      try {
        await sendQuoteRequestEmail(quoteRequest);
      } catch (error) {
        console.error("Quote email failed:", error.message);
      }
    });
  }

  res.status(201).json({ success: true, quoteRequest, notification });
});

exports.getQuoteRequests = asyncHandler(async (_req, res) => {
  const quoteRequests = await QuoteRequest.find().populate("product").sort({ createdAt: -1 });
  res.json({ success: true, quoteRequests });
});

exports.getQuoteRequestById = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id).populate("product");
  if (!quoteRequest) {
    throw new ApiError(404, "Quote request not found");
  }

  res.json({ success: true, quoteRequest });
});

exports.updateQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("product");
  if (!quoteRequest) {
    throw new ApiError(404, "Quote request not found");
  }

  res.json({ success: true, quoteRequest });
});

exports.replyToQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id).populate("product");
  if (!quoteRequest) {
    throw new ApiError(404, "Quote request not found");
  }

  const subject = String(req.body.subject || "").trim();
  const message = String(req.body.message || "").trim();

  if (!message) {
    throw new ApiError(400, "Reply message is required");
  }

  const preview = buildQuoteReply({
    name: quoteRequest.name,
    message
  });

  let delivery = "draft";

  if (HAS_REAL_SMTP) {
    try {
      await sendQuoteResponseEmail({
        to: quoteRequest.email,
        name: quoteRequest.name,
        subject,
        message
      });
      delivery = "sent";
    } catch (error) {
      delivery = "failed";
    }
  }

  quoteRequest.replySubject = subject || preview.subject;
  quoteRequest.replyMessage = message;
  quoteRequest.repliedAt = new Date();
  quoteRequest.status = "reviewed";
  await quoteRequest.save();

  res.json({
    success: true,
    delivery,
    quoteRequest,
    mailto: `mailto:${encodeURIComponent(quoteRequest.email)}?subject=${encodeURIComponent(subject || preview.subject)}&body=${encodeURIComponent(preview.text)}`
  });
});
