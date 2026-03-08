import type { Request, Response } from "express";
import { quoteService } from "./quote.service.js";

export const quoteController = {
  async create(req: Request, res: Response) {
    const quote = await quoteService.create(req.body);
    return res.status(201).json(quote);
  },

  async list(_req: Request, res: Response) {
    const quotes = await quoteService.list();
    return res.status(200).json(quotes);
  },

  async getById(req: Request, res: Response) {
    const quote = await quoteService.getById(req.params.id);
    return res.status(quote ? 200 : 404).json(quote ?? { message: "Quote request not found" });
  },

  async update(req: Request, res: Response) {
    const quote = await quoteService.update(req.params.id, req.body);
    return res.status(200).json(quote);
  },

  async notify(req: Request, res: Response) {
    const result = await quoteService.notify(req.params.id);
    return res.status(200).json(result);
  }
};
