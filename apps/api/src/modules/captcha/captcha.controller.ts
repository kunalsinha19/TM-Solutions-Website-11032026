import type { Request, Response } from "express";
import { captchaService } from "./captcha.service.js";

export const captchaController = {
  async verify(req: Request, res: Response) {
    const result = await captchaService.verify(req.body.token);
    return res.status(result.success ? 200 : 400).json(result);
  }
};
