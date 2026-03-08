import { QuoteRequestModel } from "./quote.model.js";
import { captchaService } from "../captcha/captcha.service.js";
import { ApiError } from "../../utils/api-error.js";

async function notifyQuote(_quoteId: string) {
  return {
    delivered: true
  };
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
    await notifyQuote(quote.id);
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

    return notifyQuote(id);
  }
};
