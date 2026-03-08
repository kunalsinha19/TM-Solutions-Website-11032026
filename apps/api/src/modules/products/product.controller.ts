import type { Request, Response } from "express";
import { productService } from "./product.service.js";

export const productController = {
  async list(req: Request, res: Response) {
    const data = req.auth ? await productService.listAdmin() : await productService.listPublic();
    return res.status(200).json(data);
  },

  async getBySlug(req: Request, res: Response) {
    const product = await productService.getBySlug(req.params.slug);
    return res.status(product ? 200 : 404).json(product ?? { message: "Product not found" });
  },

  async create(req: Request, res: Response) {
    const product = await productService.create(req.body, req.auth?.sub);
    return res.status(201).json(product);
  },

  async update(req: Request, res: Response) {
    const product = await productService.update(req.params.id, req.body, req.auth?.sub);
    return res.status(200).json(product);
  },

  async remove(req: Request, res: Response) {
    const result = await productService.remove(req.params.id);
    return res.status(200).json(result);
  },

  async listCategories(_req: Request, res: Response) {
    const categories = await productService.listCategories();
    return res.status(200).json(categories);
  },

  async createCategory(req: Request, res: Response) {
    const category = await productService.createCategory(req.body);
    return res.status(201).json(category);
  },

  async updateCategory(req: Request, res: Response) {
    const category = await productService.updateCategory(req.params.id, req.body);
    return res.status(200).json(category);
  },

  async removeCategory(req: Request, res: Response) {
    const result = await productService.removeCategory(req.params.id);
    return res.status(200).json(result);
  }
};
