import { Schema, model } from "mongoose";

const siteSettingsSchema = new Schema(
  {
    siteName: { type: String, required: true },
    logo: { type: String },
    contactInfo: {
      email: String,
      phone: String,
      address: String
    },
    socialLinks: [{ label: String, href: String }],
    themeDefaults: {
      mode: { type: String, default: "system" },
      accent: { type: String, default: "#b45309" }
    },
    translateEnabled: { type: Boolean, default: true },
    analytics: {
      googleAnalyticsId: String
    },
    homepageConfig: {
      heroHeadline: String,
      heroSubheadline: String,
      featuredProductIds: [{ type: String }]
    }
  },
  { timestamps: true }
);

export const SiteSettingsModel = model("SiteSettings", siteSettingsSchema);
