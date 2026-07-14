const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/jwt");
const Admin = require("../models/Admin");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendPasswordResetEmail } = require("../services/emailService");
const { log, getIp } = require("../utils/activityLogger");

exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, backupEmail, password } = req.body;

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) throw new ApiError(409, "Admin already exists with this email");

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({ name, email, backupEmail, passwordHash, isEmailVerified: true, isActive: true });

  res.status(201).json({ success: true, message: "Admin created successfully.", adminId: admin._id });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin || !admin.isActive) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const updatedAdmin = await Admin.findByIdAndUpdate(
    admin._id, { lastLoginAt: new Date() }, { new: true }
  ).select("-passwordHash");

  const token = generateToken({ id: updatedAdmin._id, email: updatedAdmin.email, role: updatedAdmin.role });

  setImmediate(() => {
    const fakeReq = { ...req, admin: updatedAdmin };
    log(fakeReq, { action: "login", category: "auth", details: "Admin logged in" });
  });

  res.json({ success: true, token, admin: updatedAdmin, message: "Login successful" });
});

exports.logout = asyncHandler(async (req, res) => {
  // JWT is stateless; client drops the token. We just log the action.
  setImmediate(() => log(req, { action: "logout", category: "auth", details: "Admin logged out" }));
  res.json({ success: true, message: "Logged out successfully" });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const admin = await Admin.findOne({ email: String(email).toLowerCase().trim(), isActive: true });

  if (!admin) {
    return res.json({ success: true, message: "If that email is registered, an OTP has been sent." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  await PasswordResetToken.create({ email: admin.email, token: otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

  await sendPasswordResetEmail(admin.email, otp);

  res.json({ success: true, message: "OTP sent to your email. It expires in 10 minutes." });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, token: otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) throw new ApiError(400, "Email, OTP, and new password are required");
  if (newPassword.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");

  const resetRecord = await PasswordResetToken.findOne({
    email: String(email).toLowerCase().trim(),
    token: otpHash, used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!resetRecord) throw new ApiError(400, "Invalid or expired OTP");

  resetRecord.used = true;
  await resetRecord.save();

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const targetAdmin = await Admin.findOneAndUpdate({ email: resetRecord.email }, { passwordHash });

  // Log using a synthetic req since the user may not be authenticated yet
  setImmediate(() => {
    const fakeReq = {
      headers: req.headers,
      socket: req.socket,
      admin: targetAdmin ? { ...targetAdmin.toObject(), role: targetAdmin.role } : null,
    };
    log(fakeReq, {
      action: "password_reset", category: "auth",
      details: `Password reset via OTP for: ${resetRecord.email}`,
      resourceName: resetRecord.email,
    });
  });

  res.json({ success: true, message: "Password reset successfully" });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});
