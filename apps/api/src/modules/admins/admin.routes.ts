import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { adminController } from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.get("/profile", asyncHandler(adminController.getProfile));
adminRouter.patch("/profile", asyncHandler(adminController.updateProfile));
