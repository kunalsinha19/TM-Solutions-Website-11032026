import { SeoPageModel } from "./seo-page.model.js";
import { ApiError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slug.js";

export const seoPageService = {
  listPublic() {
    return SeoPageModel.find({ status: "published" }).sort({ updatedAt: -1 }).lean();
  },

  listAdmin() {
    return SeoPageModel.find().sort({ updatedAt: -1 }).lean();
  },

  getBySlug(slug: string) {
    return SeoPageModel.findOne({ slug }).lean();
  },

  create(payload: Record<string, unknown>, adminId?: string) {
    return SeoPageModel.create({
      ...payload,
      slug: slugify(String(payload.slug ?? payload.title)),
      createdBy: adminId,
      updatedBy: adminId
    });
  },

  async update(id: string, payload: Record<string, unknown>, adminId?: string) {
    const page = await SeoPageModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        updatedBy: adminId,
        ...(payload.slug || payload.title
          ? { slug: slugify(String(payload.slug ?? payload.title)) }
          : {})
      },
      { new: true }
    ).lean();

    if (!page) {
      throw new ApiError(404, "SEO page not found");
    }
    return page;
  },

  async remove(id: string) {
    const page = await SeoPageModel.findByIdAndDelete(id).lean();
    if (!page) {
      throw new ApiError(404, "SEO page not found");
    }
    return { success: true };
  },

  async publish(id: string, status: "published" | "draft") {
    const page = await SeoPageModel.findByIdAndUpdate(
      id,
      {
        status,
        publishedAt: status === "published" ? new Date() : null
      },
      { new: true }
    ).lean();

    if (!page) {
      throw new ApiError(404, "SEO page not found");
    }
    return page;
  }
};
