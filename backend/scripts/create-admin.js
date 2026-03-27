const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../src/models/Admin");
const connectDB = require("../src/config/db");

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";
const backupEmail = process.env.ADMIN_BACKUP_EMAIL || email;

async function run() {
  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedBackup = String(backupEmail).toLowerCase().trim();
  const passwordHash = await bcrypt.hash(String(password), 12);

  const existing = await Admin.findOne({ email: normalizedEmail });

  if (existing) {
    existing.name = name;
    existing.backupEmail = normalizedBackup;
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    existing.isEmailVerified = true;
    await existing.save();
    console.log("Admin updated:", normalizedEmail);
  } else {
    await Admin.create({
      name,
      email: normalizedEmail,
      backupEmail: normalizedBackup,
      passwordHash,
      role: "super_admin",
      isActive: true,
      isEmailVerified: true
    });
    console.log("Admin created:", normalizedEmail);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((error) => {
  console.error("Failed to create admin:", error);
  process.exit(1);
});
