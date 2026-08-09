import { QuoteRequestModel } from "./quote.model.js";
import { captchaService } from "../captcha/captcha.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendQuoteNotification } from "../../utils/email.js";

async function notifyQuote(quote: Record<string, unknown>) {
  try {
    await sendQuoteNotification({
      name:    String(quote.name    ?? ""),
      email:   String(quote.email   ?? ""),
      phone:   String(quote.phone   ?? ""),
      company: String(quote.company ?? ""),
      message: String(quote.message ?? ""),
    });
    return { delivered: true };
  } catch (err) {
    console.error("[Quote notify] Email failed:", (err as Error).message);
    return { delivered: false, error: (err as Error).message };
  }
}

export const quoteService = {
  list() {
    return QuoteRequestModel.find().sort({ createdAt: -1 }).lean();
  },

  getById(id: string) {
    return QuoteRequestModel.findById(id).lean();
  },

  async create(payload: Record<string, unknown>) {
    const captchaToken = String(payload.captchaToken ?? "");
    const captcha = await captchaService.verify(captchaToken);
    if (!captcha.success) {
      throw new ApiError(400, "Captcha verification failed");
    }

    const quote = await QuoteRequestModel.create({
      ...payload,
      captchaVerified: true
    });
    // Fire notification asynchronously — don't block the HTTP response
    setImmediate(() => notifyQuote(quote.toObject() as Record<string, unknown>));
    return quote.toObject();
  },

  async update(id: string, payload: Record<string, unknown>) {
    const quote = await QuoteRequestModel.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!quote) {
      throw new ApiError(404, "Quote request not found");
    }
    return quote;
  },

  async notify(id: string) {
    const quote = await QuoteRequestModel.findById(id).lean();
    if (!quote) {
      throw new ApiError(404, "Quote request not found");
    }
    return notifyQuote(quote as Record<string, unknown>);
  }
};
