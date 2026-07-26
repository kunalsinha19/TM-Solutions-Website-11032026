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
router.use("/chat-sessions", chatSessionRoutes);
router.use("/blog",          blogRoutes);

module.exports = router;
