import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { AdminModel } from "../admins/admin.model.js";

export const authController = {
  async requestOtp(req: Request, res: Response) {
    const result = await authService.requestOtp(req.body.target, req.ip);
    return res.status(200).json(result);
  },

  async verifyOtp(req: Request, res: Response) {
    const result = await authService.verifyOtp(
      req.body.target,
      req.body.code,
      req.headers["user-agent"],
      req.ip
    );

    return res.status(200).json(result);
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    return res.status(200).json(result);
  },

  async me(req: Request, res: Response) {
    const admin = await AdminModel.findById(req.auth?.sub).lean();
    return res.status(200).json(admin);
  },

  async logout(req: Request, res: Response) {
    const result = await authService.logout(req.body.refreshToken);
    return res.status(200).json(result);
  }
};
