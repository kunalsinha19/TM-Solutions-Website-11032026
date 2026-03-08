import type { Request, Response } from "express";
import { mediaService } from "./media.service.js";

export const mediaController = {
  async list(_req: Request, res: Response) {
    const assets = await mediaService.list();
    return res.status(200).json(assets);
  },

  async create(req: Request, res: Response) {
    const asset = await mediaService.create(req.body, req.auth?.sub);
    return res.status(201).json(asset);
  },

  async remove(req: Request, res: Response) {
    const result = await mediaService.remove(req.params.id);
    return res.status(200).json(result);
  }
};
