import { Router } from "express";
import { productSchema } from "@tara-maa/validation";
import { productController } from "./product.controller.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";

export const productRouter = Router();
export const productCategoryRouter = Router();

productRouter.get("/", asyncHandler(productController.list));
productRouter.get("/:slug", asyncHandler(productController.getBySlug));
productRouter.post("/", requireAuth, validate(productSchema), asyncHandler(productController.create));
productRouter.patch("/:id", requireAuth, validate(productSchema.partial()), asyncHandler(productController.update));
productRouter.delete("/:id", requireAuth, asyncHandler(productController.remove));

productCategoryRouter.get("/", asyncHandler(productController.listCategories));
productCategoryRouter.post("/", requireAuth, asyncHandler(productController.createCategory));
productCategoryRouter.patch("/:id", requireAuth, asyncHandler(productController.updateCategory));
productCategoryRouter.delete("/:id", requireAuth, asyncHandler(productController.removeCategory));
