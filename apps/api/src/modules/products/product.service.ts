import { slugify } from "../../utils/slug.js";
import { ApiError } from "../../utils/api-error.js";
import { ProductCategoryModel, ProductModel } from "./product.model.js";

export const productService = {
  listPublic() {
    return ProductModel.find({ status: "published" }).sort({ updatedAt: -1 }).lean();
  },

  listAdmin() {
    return ProductModel.find().sort({ updatedAt: -1 }).lean();
  },

  getBySlug(slug: string) {
    return ProductModel.findOne({ slug }).lean();
  },

  async create(payload: Record<string, unknown>, adminId?: string) {
    const product = await ProductModel.create({
      ...payload,
      slug: slugify(String(payload.slug ?? payload.name)),
      createdBy: adminId,
      updatedBy: adminId,
      publishedAt: payload.status === "published" ? new Date() : null
    });

    return product.toObject();
  },

  async update(id: string, payload: Record<string, unknown>, adminId?: string) {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        updatedBy: adminId,
        ...(payload.slug || payload.name
          ? { slug: slugify(String(payload.slug ?? payload.name)) }
          : {}),
        ...(payload.status === "published" ? { publishedAt: new Date() } : {})
      },
      { new: true }
    ).lean();

    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  },

  async remove(id: string) {
    const product = await ProductModel.findByIdAndDelete(id).lean();
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return { success: true };
  },

  listCategories() {
    return ProductCategoryModel.find().sort({ sortOrder: 1, name: 1 }).lean();
  },

  createCategory(payload: Record<string, unknown>) {
    return ProductCategoryModel.create({
      ...payload,
      slug: slugify(String(payload.slug ?? payload.name))
    });
  },

  async updateCategory(id: string, payload: Record<string, unknown>) {
    const category = await ProductCategoryModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        ...(payload.slug || payload.name
          ? { slug: slugify(String(payload.slug ?? payload.name)) }
          : {})
      },
      { new: true }
    ).lean();

    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  },

  async removeCategory(id: string) {
    const category = await ProductCategoryModel.findByIdAndDelete(id).lean();
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return { success: true };
  }
};
