import { config } from "dotenv";

config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/tara-maa",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 10),
  apiOrigin: process.env.API_ORIGIN ?? "http://localhost:4000",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  // Email (SMTP) — set these in Railway env vars
  smtpHost: process.env.SMTP_HOST ?? "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpSecure: process.env.SMTP_SECURE !== "false", // default true
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "support.tmsindia@gmail.com",
  // Super-admin seed (email to auto-create on first boot)
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? "",
  superAdminName: process.env.SUPER_ADMIN_NAME ?? "Super Admin",
  // Quote notification — who receives new quote emails
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "support.tmsindia@gmail.com",
};
