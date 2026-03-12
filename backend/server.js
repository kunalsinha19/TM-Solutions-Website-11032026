const dotenv = require("dotenv");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { PORT } = require("./src/config/env");

dotenv.config();

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
