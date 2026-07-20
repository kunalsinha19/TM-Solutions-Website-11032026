const express = require("express");
const authRoutes        = require("./authRoutes");
const adminRoutes       = require("./adminRoutes");
const productRoutes     = require("./productRoutes");
const categoryRoutes    = require("./categoryRoutes");
const seoPageRoutes     = require("./seoPageRoutes");
const quoteRoutes       = require("./quoteRoutes");
const settingsRoutes    = require("./settingsRoutes");
const mediaRoutes       = require("./mediaRoutes");
const contactRoutes     = require("./contactRoutes");
const analyticsRoutes   = require("./analyticsRoutes");
const activityLogRoutes = require("./activityLogRoutes");
const systemLogRoutes   = require("./systemLogRoutes");
const brochureRoutes    = require("./brochureRoutes");
const youtubeRoutes     = require("./youtubeRoutes");
const chatSessionRoutes = require("./chatSessionRoutes");

const router = express.Router();

router.use("/auth",          authRoutes);
router.use("/admins",        adminRoutes);
router.use("/products",      productRoutes);
router.use("/categories",    categoryRoutes);
router.use("/seo-pages",     seoPageRoutes);
router.use("/quotes",        quoteRoutes);
router.use("/settings",      settingsRoutes);
router.use("/media",         mediaRoutes);
router.use("/contacts",      contactRoutes);
router.use("/analytics",     analyticsRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/system-logs",   systemLogRoutes);
router.use("/brochures",     brochureRoutes);
router.use("/youtube",       youtubeRoutes);
router.use("/chat-sessions", chatSessionRoutes);

module.exports = router;
