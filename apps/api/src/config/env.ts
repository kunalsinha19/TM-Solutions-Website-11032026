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
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000"
};
