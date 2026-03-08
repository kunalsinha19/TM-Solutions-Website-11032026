import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminRouter } from "./modules/admins/admin.routes.js";
import { productCategoryRouter, productRouter } from "./modules/products/product.routes.js";
import { seoPageRouter } from "./modules/seo-pages/seo-page.routes.js";
import { quoteRouter } from "./modules/quotes/quote.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { captchaRouter } from "./modules/captcha/captcha.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [env.webOrigin],
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "api" });
  });
  app.get("/api/v1/sitemap-data", (_req, res) => {
    res.status(200).json({
      productsEndpoint: "/api/v1/products",
      seoPagesEndpoint: "/api/v1/seo-pages"
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/product-categories", productCategoryRouter);
  app.use("/api/v1/seo-pages", seoPageRouter);
  app.use("/api/v1/quotes", quoteRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/media", mediaRouter);
  app.use("/api/v1/captcha", captchaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
