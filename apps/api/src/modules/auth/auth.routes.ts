import { Router } from "express";
import { requestOtpSchema, verifyOtpSchema } from "@tara-maa/validation";
import { authController } from "./auth.controller.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { rateLimit } from "../../middlewares/rate-limit.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";

export const authRouter = Router();

authRouter.post(
  "/request-otp",
  rateLimit(5, 60000),
  validate(requestOtpSchema),
  asyncHandler(authController.requestOtp)
);
authRouter.post(
  "/verify-otp",
  rateLimit(10, 60000),
  validate(verifyOtpSchema),
  asyncHandler(authController.verifyOtp)
);
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
