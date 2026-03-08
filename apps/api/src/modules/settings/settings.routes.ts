import { Router } from "express";
import { settingsSchema } from "@tara-maa/validation";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { settingsController } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/", asyncHandler(settingsController.get));
settingsRouter.patch("/", requireAuth, validate(settingsSchema), asyncHandler(settingsController.update));
