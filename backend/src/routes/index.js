const express = require("express");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const seoPageRoutes = require("./seoPageRoutes");
const quoteRoutes = require("./quoteRoutes");
const settingsRoutes = require("./settingsRoutes");
const mediaRoutes = require("./mediaRoutes");
const contactRoutes = require("./contactRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/seo-pages", seoPageRoutes);
router.use("/quotes", quoteRoutes);
router.use("/settings", settingsRoutes);
router.use("/media", mediaRoutes);
router.use("/contacts", contactRoutes);

module.exports = router;

