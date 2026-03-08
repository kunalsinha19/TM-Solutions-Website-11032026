import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { mediaController } from "./media.controller.js";

export const mediaRouter = Router();

mediaRouter.use(requireAuth);
mediaRouter.get("/", asyncHandler(mediaController.list));
mediaRouter.post("/", asyncHandler(mediaController.create));
mediaRouter.delete("/:id", asyncHandler(mediaController.remove));
