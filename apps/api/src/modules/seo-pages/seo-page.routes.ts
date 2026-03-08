import { Router } from "express";
import { seoPageSchema } from "@tara-maa/validation";
import { seoPageController } from "./seo-page.controller.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";

export const seoPageRouter = Router();

seoPageRouter.get("/", asyncHandler(seoPageController.list));
seoPageRouter.get("/:slug", asyncHandler(seoPageController.getBySlug));
seoPageRouter.post("/", requireAuth, validate(seoPageSchema), asyncHandler(seoPageController.create));
seoPageRouter.patch("/:id", requireAuth, validate(seoPageSchema.partial()), asyncHandler(seoPageController.update));
seoPageRouter.delete("/:id", requireAuth, asyncHandler(seoPageController.remove));
seoPageRouter.post("/:id/publish", requireAuth, asyncHandler(seoPageController.publish));
seoPageRouter.post("/:id/unpublish", requireAuth, asyncHandler(seoPageController.unpublish));
