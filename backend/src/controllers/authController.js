const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/jwt");
const generateOtp = require("../utils/generateOtp");
const Admin = require("../models/Admin");
const OtpVerification = require("../models/OtpVerification");
const PasswordResetToken = require("../models/PasswordResetToken");
const {
  sendAdminOtpEmail,
  sendPasswordResetEmail
} = require("../services/emailService");

const issueOtp = async (email, purpose) => {
  const code = generateOtp();
  await OtpVerification.create({
    email,
    code,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  await sendAdminOtpEmail(email, code, purpose);

  return code;
};

exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, backupEmail, password } = req.body;

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new ApiError(409, "Admin already exists with this email");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({ name, email, backupEmail, passwordHash });
  await issueOtp(admin.email, "verify_email");

  res.status(201).json({
    success: true,
    message: "Admin created. Verification OTP sent to email.",
    adminId: admin._id
  });
});

exports.verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const record = await OtpVerification.findOne({
    email,
    code: otp,
    purpose: "verify_email",
    used: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  record.used = true;
  await record.save();

  await Admin.findOneAndUpdate({ email }, { isEmailVerified: true });

  res.json({ success: true, message: "Email verified successfully" });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!admin.isEmailVerified) {
    throw new ApiError(403, "Email is not verified yet");
  }

  await issueOtp(admin.email, "login");

  res.json({ success: true, message: "Login OTP sent to admin email" });
});

exports.verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const record = await OtpVerification.findOne({
    email,
    code: otp,
    purpose: "login",
    used: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  record.used = true;
  await record.save();

  const admin = await Admin.findOneAndUpdate(
    { email },
    { lastLoginAt: new Date() },
    { new: true }
  ).select("-passwordHash");

  const token = generateToken({ id: admin._id, email: admin.email, role: admin.role });

  res.json({
    success: true,
    token,
    admin
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email, backupEmail } = req.body;
  const admin = await Admin.findOne({ email, backupEmail });

  if (!admin) {
    throw new ApiError(404, "Admin or backup email not matched");
  }

  const token = crypto.randomBytes(24).toString("hex");
  await PasswordResetToken.create({
    email,
    token,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  });

  await sendPasswordResetEmail(backupEmail, token);

  res.json({ success: true, message: "Recovery token sent to backup email" });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  const resetRecord = await PasswordResetToken.findOne({
    email,
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!resetRecord) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  resetRecord.used = true;
  await resetRecord.save();

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await Admin.findOneAndUpdate({ email }, { passwordHash });

  res.json({ success: true, message: "Password reset successfully" });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});
