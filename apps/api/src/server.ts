import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startBackgroundJobs } from "./jobs/index.js";

async function bootstrap() {
  await connectDatabase();
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
