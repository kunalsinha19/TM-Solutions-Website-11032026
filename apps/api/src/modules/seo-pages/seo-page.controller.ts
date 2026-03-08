import type { Request, Response } from "express";
import { seoPageService } from "./seo-page.service.js";

export const seoPageController = {
  async list(req: Request, res: Response) {
    const pages = req.auth ? await seoPageService.listAdmin() : await seoPageService.listPublic();
    return res.status(200).json(pages);
  },

  async getBySlug(req: Request, res: Response) {
    const page = await seoPageService.getBySlug(req.params.slug);
    return res.status(page ? 200 : 404).json(page ?? { message: "SEO page not found" });
  },

  async create(req: Request, res: Response) {
    const page = await seoPageService.create(req.body, req.auth?.sub);
    return res.status(201).json(page);
  },

  async update(req: Request, res: Response) {
    const page = await seoPageService.update(req.params.id, req.body, req.auth?.sub);
    return res.status(200).json(page);
  },

  async remove(req: Request, res: Response) {
    const result = await seoPageService.remove(req.params.id);
    return res.status(200).json(result);
  },

  async publish(req: Request, res: Response) {
    const page = await seoPageService.publish(req.params.id, "published");
    return res.status(200).json(page);
  },

  async unpublish(req: Request, res: Response) {
    const page = await seoPageService.publish(req.params.id, "draft");
    return res.status(200).json(page);
  }
};
