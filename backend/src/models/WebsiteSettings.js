const mongoose = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlValidator = {
  validator(value) {
    if (!value) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message: "Must be a valid absolute URL"
};

const contactInfoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      match: emailRegex
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30
    },
    address: {
      type: String,
      default: "",
      maxlength: 300
    }
  },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
      validate: urlValidator
    }
  },
  { _id: false }
);

const websiteSettingsSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      default: "primary",
      unique: true,
      immutable: true,
      index: true
    },
    siteName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    siteUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
      validate: urlValidator
    },
    defaultMetaTitle: {
      type: String,
      default: "",
      maxlength: 70
    },
    defaultMetaDescription: {
      type: String,
      default: "",
      maxlength: 160
    },
    logoUrl: {
      type: String,
      default: "",
      maxlength: 500,
      validate: urlValidator
    },
    faviconUrl: {
      type: String,
      default: "",
      maxlength: 500,
      validate: urlValidator
    },
    contactInfo: {
      type: contactInfoSchema,
      default: () => ({})
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: []
    },
    themeMode: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system"
    },
    analytics: {
      googleAnalyticsId: {
        type: String,
        default: "",
        trim: true,
        maxlength: 50
      }
    },
    seoDefaults: {
      robots: {
        type: String,
        default: "index,follow",
        maxlength: 40
      },
      ogImage: {
        type: String,
        default: "",
        maxlength: 500,
        validate: urlValidator
      }
    },
    homepage: {
      heroTitle: {
        type: String,
        default: "",
        maxlength: 180
      },
      heroSubtitle: {
        type: String,
        default: "",
        maxlength: 500
      },
      featuredProductIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product",
        default: []
      }
    }
  },
  { timestamps: true }
);

websiteSettingsSchema.index({ siteKey: 1 }, { unique: true });
websiteSettingsSchema.index({ siteName: 1 });
websiteSettingsSchema.index({ defaultMetaTitle: 1, defaultMetaDescription: 1 });

module.exports = mongoose.model("WebsiteSettings", websiteSettingsSchema);
