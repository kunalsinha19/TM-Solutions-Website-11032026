const mongoose = require("mongoose");
const ApiError = require("../utils/apiError");

const allowedThemeModes = ["light", "dark", "system"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pushError(errors, field, message) {
  errors.push({ field, message });
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidEmail(value) {
  return typeof value === "string" && emailRegex.test(value);
}

function isValidUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateStringField(value, field, errors, options = {}) {
  const {
    required = false,
    min,
    max,
    allowEmpty = true,
    enumValues,
    format,
    absoluteUrl = false
  } = options;

  if (value === undefined) {
    if (required) {
      pushError(errors, field, `${field} is required`);
    }
    return;
  }

  if (typeof value !== "string") {
    pushError(errors, field, `${field} must be a string`);
    return;
  }

  const trimmed = value.trim();

  if (!allowEmpty && trimmed.length === 0) {
    pushError(errors, field, `${field} cannot be empty`);
  }

  if (min !== undefined && trimmed.length > 0 && trimmed.length < min) {
    pushError(errors, field, `${field} must be at least ${min} characters`);
  }

  if (max !== undefined && value.length > max) {
    pushError(errors, field, `${field} must be at most ${max} characters`);
  }

  if (enumValues && !enumValues.includes(value)) {
    pushError(errors, field, `${field} must be one of: ${enumValues.join(", ")}`);
  }

  if (format === "email" && trimmed.length > 0 && !isValidEmail(trimmed)) {
    pushError(errors, field, `${field} must be a valid email`);
  }

  if (absoluteUrl && trimmed.length > 0 && !isValidUrl(trimmed)) {
    pushError(errors, field, `${field} must be a valid absolute URL`);
  }
}

function validateContactInfo(contactInfo, errors) {
  if (contactInfo === undefined) {
    return;
  }

  if (!isObject(contactInfo)) {
    pushError(errors, "contactInfo", "contactInfo must be an object");
    return;
  }

  validateStringField(contactInfo.email, "contactInfo.email", errors, {
    format: "email"
  });
  validateStringField(contactInfo.phone, "contactInfo.phone", errors, {
    max: 30
  });
  validateStringField(contactInfo.address, "contactInfo.address", errors, {
    max: 300
  });
}

function validateSocialLinks(socialLinks, errors) {
  if (socialLinks === undefined) {
    return;
  }

  if (!Array.isArray(socialLinks)) {
    pushError(errors, "socialLinks", "socialLinks must be an array");
    return;
  }

  socialLinks.forEach((item, index) => {
    if (!isObject(item)) {
      pushError(errors, `socialLinks[${index}]`, "Each social link must be an object");
      return;
    }

    validateStringField(item.label, `socialLinks[${index}].label`, errors, {
      required: true,
      allowEmpty: false,
      max: 60
    });
    validateStringField(item.url, `socialLinks[${index}].url`, errors, {
      required: true,
      allowEmpty: false,
      max: 500,
      absoluteUrl: true
    });
  });
}

function validateAnalytics(analytics, errors) {
  if (analytics === undefined) {
    return;
  }

  if (!isObject(analytics)) {
    pushError(errors, "analytics", "analytics must be an object");
    return;
  }

  validateStringField(analytics.googleAnalyticsId, "analytics.googleAnalyticsId", errors, {
    max: 50
  });
}

function validateSeoDefaults(seoDefaults, errors) {
  if (seoDefaults === undefined) {
    return;
  }

  if (!isObject(seoDefaults)) {
    pushError(errors, "seoDefaults", "seoDefaults must be an object");
    return;
  }

  validateStringField(seoDefaults.robots, "seoDefaults.robots", errors, {
    max: 40
  });
  validateStringField(seoDefaults.ogImage, "seoDefaults.ogImage", errors, {
    max: 500,
    absoluteUrl: true
  });
}

function validateHomepage(homepage, errors) {
  if (homepage === undefined) {
    return;
  }

  if (!isObject(homepage)) {
    pushError(errors, "homepage", "homepage must be an object");
    return;
  }

  validateStringField(homepage.heroTitle, "homepage.heroTitle", errors, {
    max: 180
  });
  validateStringField(homepage.heroSubtitle, "homepage.heroSubtitle", errors, {
    max: 500
  });

  if (homepage.featuredProductIds !== undefined) {
    if (!Array.isArray(homepage.featuredProductIds)) {
      pushError(errors, "homepage.featuredProductIds", "featuredProductIds must be an array");
    } else {
      homepage.featuredProductIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          pushError(errors, `homepage.featuredProductIds[${index}]`, "Each featuredProductId must be a valid ObjectId");
        }
      });
    }
  }
}

function validateSettingsPayload(req, _res, next) {
  const payload = req.body || {};
  const errors = [];
  const isCreateLike = req.method === "POST" || req.method === "PUT";

  if (!isObject(payload)) {
    return next(new ApiError(400, "Request body must be an object"));
  }

  validateStringField(payload.siteName, "siteName", errors, {
    required: isCreateLike,
    allowEmpty: false,
    min: 2,
    max: 120
  });
  validateStringField(payload.siteUrl, "siteUrl", errors, {
    max: 500,
    absoluteUrl: true
  });
  validateStringField(payload.defaultMetaTitle, "defaultMetaTitle", errors, {
    max: 70
  });
  validateStringField(payload.defaultMetaDescription, "defaultMetaDescription", errors, {
    max: 160
  });
  validateStringField(payload.logoUrl, "logoUrl", errors, {
    max: 500,
    absoluteUrl: true
  });
  validateStringField(payload.faviconUrl, "faviconUrl", errors, {
    max: 500,
    absoluteUrl: true
  });
  validateStringField(payload.themeMode, "themeMode", errors, {
    enumValues: allowedThemeModes
  });

  validateContactInfo(payload.contactInfo, errors);
  validateSocialLinks(payload.socialLinks, errors);
  validateAnalytics(payload.analytics, errors);
  validateSeoDefaults(payload.seoDefaults, errors);
  validateHomepage(payload.homepage, errors);

  if (errors.length > 0) {
    return next(new ApiError(400, "Settings validation failed", errors));
  }

  return next();
}

module.exports = {
  validateSettingsPayload
};
