import { Router } from "express";
import { quoteSchema } from "@tara-maa/validation";
import { quoteController } from "./quote.controller.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";

export const quoteRouter = Router();

quoteRouter.post("/", validate(quoteSchema), asyncHandler(quoteController.create));
quoteRouter.get("/", requireAuth, asyncHandler(quoteController.list));
quoteRouter.get("/:id", requireAuth, asyncHandler(quoteController.getById));
quoteRouter.patch("/:id", requireAuth, asyncHandler(quoteController.update));
quoteRouter.post("/:id/notify", requireAuth, asyncHandler(quoteController.notify));
