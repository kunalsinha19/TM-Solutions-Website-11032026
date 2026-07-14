const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const Admin = require("../models/Admin");
const { log } = require("../utils/activityLogger");

exports.getAdmins = asyncHandler(async (_req, res) => {
  const admins = await Admin.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json({ success: true, admins });
});

exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, backupEmail, password, role = "admin", isActive = true } = req.body;

  const existingAdmin = await Admin.findOne({ email: String(email || "").toLowerCase().trim() });
  if (existingAdmin) {
    throw new ApiError(409, "Admin already exists with this email");
  }

  const passwordHash = await bcrypt.hash(String(password), 12);
  const admin = await Admin.create({
    name, email, backupEmail, passwordHash, role, isActive, isEmailVerified: true,
  });

  setImmediate(() => log(req, {
    action: "admin_created", category: "admin",
    details: `Created admin: ${name} (${email})`,
    resourceId: admin._id, resourceName: name,
  }));

  res.status(201).json({ success: true, admin: await Admin.findById(admin._id).select("-passwordHash") });
});

exports.updateAdmin = asyncHandler(async (req, res) => {
  const { name, email, backupEmail, password, role, isActive } = req.body;
  const target = await Admin.findById(req.params.id);

  if (!target) throw new ApiError(404, "Admin not found");

  if (email && email.toLowerCase().trim() !== target.email) {
    const emailInUse = await Admin.findOne({ email: email.toLowerCase().trim(), _id: { $ne: target._id } });
    if (emailInUse) throw new ApiError(409, "Another admin already uses this email");
  }

  const previousValue = JSON.stringify({ name: target.name, email: target.email, role: target.role, isActive: target.isActive });

  target.name      = name ?? target.name;
  target.email     = email ? email.toLowerCase().trim() : target.email;
  target.backupEmail = backupEmail ? backupEmail.toLowerCase().trim() : target.backupEmail;
  target.role      = role ?? target.role;
  target.isActive  = typeof isActive === "boolean" ? isActive : target.isActive;

  if (password) {
    target.passwordHash = await bcrypt.hash(String(password), 12);
  }

  await target.save();

  setImmediate(() => log(req, {
    action: "admin_updated", category: "admin",
    details: `Updated admin: ${target.name}`,
    resourceId: target._id, resourceName: target.name,
    previousValue,
    newValue: JSON.stringify({ name: target.name, email: target.email, role: target.role, isActive: target.isActive }),
  }));

  res.json({ success: true, admin: await Admin.findById(target._id).select("-passwordHash") });
});

exports.deleteAdmin = asyncHandler(async (req, res) => {
  const target = await Admin.findById(req.params.id);

  if (!target) throw new ApiError(404, "Admin not found");

  if (String(target._id) === String(req.admin._id)) {
    throw new ApiError(400, "You cannot delete your own admin account");
  }

  await Admin.findByIdAndDelete(target._id);

  setImmediate(() => log(req, {
    action: "admin_deleted", category: "admin",
    details: `Deleted admin: ${target.name} (${target.email})`,
    resourceId: target._id, resourceName: target.name,
  }));

  res.json({ success: true, message: "Admin deleted" });
});
