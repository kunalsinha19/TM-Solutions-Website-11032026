import type { Request, Response } from "express";
import { settingsService } from "./settings.service.js";

export const settingsController = {
  async get(_req: Request, res: Response) {
    const settings = await settingsService.getSettings();
    return res.status(200).json(settings);
  },

  async update(req: Request, res: Response) {
    const settings = await settingsService.updateSettings(req.body);
    return res.status(200).json(settings);
  }
};
