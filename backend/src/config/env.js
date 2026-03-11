const dotenv = require("dotenv");

dotenv.config({ path: process.env.ENV_FILE || ".env" });

function isPlaceholder(value) {
  return !value || /^your-|^replace-|example\.com$/.test(String(value));
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tara-maa-backend",
  JWT_SECRET: process.env.JWT_SECRET || "change-this-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@taramaasolutions.com",
  ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL || "kunal.nic10@gmail.com",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  CAPTCHA_SECRET: process.env.CAPTCHA_SECRET || "",
  CAPTCHA_SITE_KEY: process.env.CAPTCHA_SITE_KEY || "",
  CAPTCHA_BYPASS: process.env.CAPTCHA_BYPASS === "true",
  HAS_REAL_SMTP: !isPlaceholder(process.env.SMTP_HOST) && !isPlaceholder(process.env.SMTP_USER) && !isPlaceholder(process.env.SMTP_PASS),
  HAS_REAL_CAPTCHA: !isPlaceholder(process.env.CAPTCHA_SECRET) && !isPlaceholder(process.env.CAPTCHA_SITE_KEY)
};
