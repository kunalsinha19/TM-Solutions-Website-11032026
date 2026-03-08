import { SiteSettingsModel } from "./settings.model.js";

const fallbackSettings = {
  siteName: "Tara Maa Solutions",
  contactInfo: {
    email: "sales@taramaasolutions.com",
    phone: "+91 00000 00000",
    address: "Kolkata, India"
  },
  socialLinks: [],
  themeDefaults: {
    mode: "system",
    accent: "#b45309"
  },
  translateEnabled: true,
  homepageConfig: {
    heroHeadline: "Industrial-grade products for modern B2B operations",
    heroSubheadline: "Catalog-first marketing with fast quote conversion.",
    featuredProductIds: []
  }
};

export const settingsService = {
  async getSettings() {
    const settings = await SiteSettingsModel.findOne().lean();
    return settings ?? fallbackSettings;
  },

  async updateSettings(payload: Record<string, unknown>) {
    const settings = await SiteSettingsModel.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true
    }).lean();
    return settings;
  }
};
