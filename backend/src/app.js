const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const rateLimit = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { CLIENT_URL, CLIENT_URLS, ADMIN_URL, ADMIN_URLS, NODE_ENV } = require("./config/env");

const app = express();
app.set("trust proxy", 1);

const productionOrigins = [
  "https://www.tmsolutionsindia.com",
  "https://tmsolutionsindia.com"
];

const allowedOrigins = Array.from(new Set([
  ...(CLIENT_URLS || []),
  ...(ADMIN_URLS || []),
  CLIENT_URL,
  ADMIN_URL,
  ...(NODE_ENV === "production" ? productionOrigins : []),
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean)));

const railwayOriginPattern = /\\.up\\.railway\\.app$|\\.railway\\.app$/i;

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.includes(origin) || railwayOriginPattern.test(origin);
    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit);
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, service: "backend-api" });
});

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;


