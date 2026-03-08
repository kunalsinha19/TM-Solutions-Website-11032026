import { ApiError } from "../../utils/api-error.js";
import { AdminModel } from "./admin.model.js";

export const adminService = {
  async getProfile(adminId: string) {
    const admin = await AdminModel.findById(adminId).lean();
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    return admin;
  },

  async updateProfile(adminId: string, payload: Record<string, unknown>) {
    const admin = await AdminModel.findByIdAndUpdate(adminId, payload, {
      new: true
    }).lean();

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    return admin;
  }
};
