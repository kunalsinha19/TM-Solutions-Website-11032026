import crypto from "node:crypto";
import { verifyToken, signToken } from "../../utils/jwt.js";
import { ApiError } from "../../utils/api-error.js";
import { env } from "../../config/env.js";
import { AdminModel } from "../admins/admin.model.js";
import { AdminSessionModel, OtpCodeModel } from "./auth.model.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authService = {
  async requestOtp(target: string, ip?: string) {
    const admin = await AdminModel.findOne({
      $or: [{ email: target }, { phone: target }],
      isActive: true
    }).lean();

    if (!admin) {
      throw new ApiError(404, "Admin account not found");
    }

    const code = generateOtp();
    await OtpCodeModel.create({
      target,
      purpose: "admin_login",
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + env.otpTtlMinutes * 60 * 1000),
      ip
    });

    return {
      message: "OTP generated",
      debugCode: env.nodeEnv === "development" ? code : undefined
    };
  },

  async verifyOtp(target: string, code: string, userAgent?: string, ip?: string) {
    const otp = await OtpCodeModel.findOne({
      target,
      purpose: "admin_login",
      consumedAt: null
    }).sort({ createdAt: -1 });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new ApiError(401, "OTP expired or invalid");
    }

    otp.attemptCount += 1;
    if (otp.codeHash !== hashOtp(code)) {
      await otp.save();
      throw new ApiError(401, "OTP expired or invalid");
    }

    otp.consumedAt = new Date();
    await otp.save();

    const admin = await AdminModel.findOne({
      $or: [{ email: target }, { phone: target }],
      isActive: true
    });

    if (!admin) {
      throw new ApiError(404, "Admin account not found");
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const accessToken = signToken(
      { sub: admin.id, role: admin.role, type: "access" },
      env.accessTokenTtl
    );
    const refreshToken = signToken(
      { sub: admin.id, role: admin.role, type: "refresh" },
      `${env.refreshTokenTtlDays}d`
    );

    await AdminSessionModel.create({
      adminId: admin.id,
      refreshTokenHash: hashToken(refreshToken),
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000)
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        _id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      }
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyToken(refreshToken);
    if (payload.type !== "refresh") {
      throw new ApiError(401, "Invalid refresh token");
    }

    const session = await AdminSessionModel.findOne({
      adminId: payload.sub,
      refreshTokenHash: hashToken(refreshToken)
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new ApiError(401, "Refresh session expired");
    }

    const admin = await AdminModel.findById(payload.sub);
    if (!admin) {
      throw new ApiError(404, "Admin account not found");
    }

    session.lastUsedAt = new Date();
    await session.save();

    const accessToken = signToken(
      { sub: admin.id, role: admin.role, type: "access" },
      env.accessTokenTtl
    );

    return {
      accessToken,
      admin: {
        _id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      }
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { success: true };
    }

    await AdminSessionModel.deleteOne({
      refreshTokenHash: hashToken(refreshToken)
    });

    return { success: true };
  }
};
