const express = require("express");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const seoPageRoutes = require("./seoPageRoutes");
const quoteRoutes = require("./quoteRoutes");
const settingsRoutes = require("./settingsRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/seo-pages", seoPageRoutes);
router.use("/quotes", quoteRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
