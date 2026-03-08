const asyncHandler = require("../utils/asyncHandler");
const QuoteRequest = require("../models/QuoteRequest");
const { validateCaptcha } = require("../services/captchaService");
const { sendQuoteRequestEmail } = require("../services/emailService");
const ApiError = require("../utils/apiError");

exports.createQuoteRequest = asyncHandler(async (req, res) => {
  const { captchaToken, ...payload } = req.body;

  if (!captchaToken) {
    throw new ApiError(400, "Captcha token is required");
  }

  const captcha = await validateCaptcha(captchaToken, req.ip);

  if (!captcha.success) {
    throw new ApiError(400, "Captcha validation failed", captcha);
  }

  const quoteRequest = await QuoteRequest.create({
    ...payload,
    captchaVerified: true
  });

  await sendQuoteRequestEmail(quoteRequest);

  res.status(201).json({ success: true, quoteRequest });
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
