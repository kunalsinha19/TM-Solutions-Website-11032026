import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { captchaController } from "./captcha.controller.js";

export const captchaRouter = Router();

captchaRouter.post("/verify", asyncHandler(captchaController.verify));
