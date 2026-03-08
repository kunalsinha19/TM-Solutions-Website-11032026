import { ApiError } from "../../utils/api-error.js";
import { MediaAssetModel } from "./media.model.js";

export const mediaService = {
  list() {
    return MediaAssetModel.find().sort({ createdAt: -1 }).lean();
  },

  create(payload: Record<string, unknown>, adminId?: string) {
    return MediaAssetModel.create({
      ...payload,
      uploadedBy: adminId
    });
  },

  async remove(id: string) {
    const asset = await MediaAssetModel.findByIdAndDelete(id).lean();
    if (!asset) {
      throw new ApiError(404, "Media asset not found");
    }
    return { success: true };
  }
};
