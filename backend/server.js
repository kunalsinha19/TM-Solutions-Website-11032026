const dotenv = require("dotenv");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { PORT } = require("./src/config/env");

dotenv.config();

async function autoSeedBlogs() {
  try {
    const { seedBlogs } = require("./scripts/seed-blogs");
    await seedBlogs();
  } catch (err) {
    console.warn("[auto-seed] Blog seeding skipped:", err.message);
  }
}

async function startServer() {
  await connectDB();
  await autoSeedBlogs();
  app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
