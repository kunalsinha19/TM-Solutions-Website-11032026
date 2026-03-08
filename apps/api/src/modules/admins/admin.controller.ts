import type { Request, Response } from "express";
import { adminService } from "./admin.service.js";

export const adminController = {
  async getProfile(req: Request, res: Response) {
    const profile = await adminService.getProfile(req.auth!.sub);
    return res.status(200).json(profile);
  },

  async updateProfile(req: Request, res: Response) {
    const profile = await adminService.updateProfile(req.auth!.sub, req.body);
    return res.status(200).json(profile);
  }
};
