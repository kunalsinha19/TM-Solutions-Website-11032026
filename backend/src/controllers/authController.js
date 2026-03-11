const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/jwt");
const Admin = require("../models/Admin");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sendPasswordResetEmail } = require("../services/emailService");

exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, backupEmail, password } = req.body;

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new ApiError(409, "Admin already exists with this email");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({
    name,
    email,
    backupEmail,
    passwordHash,
    isEmailVerified: true,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: "Admin created successfully.",
    adminId: admin._id
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin || !admin.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const updatedAdmin = await Admin.findByIdAndUpdate(
    admin._id,
    { lastLoginAt: new Date() },
    { new: true }
  ).select("-passwordHash");

  const token = generateToken({ id: updatedAdmin._id, email: updatedAdmin.email, role: updatedAdmin.role });

  res.json({
    success: true,
    token,
    admin: updatedAdmin,
    message: "Login successful"
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
