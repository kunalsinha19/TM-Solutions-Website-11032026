import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startBackgroundJobs } from "./jobs/index.js";
import { AdminModel } from "./modules/admins/admin.model.js";

/** Create the super admin on first boot if SUPER_ADMIN_EMAIL is set and no admin exists yet. */
async function seedSuperAdmin() {
  if (!env.superAdminEmail) return;
  const count = await AdminModel.countDocuments();
  if (count > 0) return;
  await AdminModel.create({
    name: env.superAdminName,
    email: env.superAdminEmail,
    role: "super_admin",
    isActive: true,
  });
  console.log(`[seed] Super admin created: ${env.superAdminEmail}`);
}

async function bootstrap() {
  await connectDatabase();
  await seedSuperAdmin();
  const app = createApp();
  const jobs = startBackgroundJobs();

  const server = app.listen(env.port, () => {
    console.log(`API listening on ${env.port}`);
  });

  const shutdown = () => {
    jobs.stop();
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
