const express = require("express");
const authRoutes              = require("./authRoutes");
const adminRoutes             = require("./adminRoutes");
const productRoutes           = require("./productRoutes");
const categoryRoutes          = require("./categoryRoutes");
const seoPageRoutes           = require("./seoPageRoutes");
const quoteRoutes             = require("./quoteRoutes");
const settingsRoutes          = require("./settingsRoutes");
const mediaRoutes             = require("./mediaRoutes");
const contactRoutes           = require("./contactRoutes");
const analyticsRoutes         = require("./analyticsRoutes");
const activityLogRoutes       = require("./activityLogRoutes");
const systemLogRoutes         = require("./systemLogRoutes");
const brochureRoutes          = require("./brochureRoutes");
const youtubeRoutes           = require("./youtubeRoutes");
const chatSessionRoutes       = require("./chatSessionRoutes");
const blogRoutes              = require("./blogRoutes");
// Invoice & Inventory module
const invCustomerRoutes       = require("./invCustomerRoutes");
const invSupplierRoutes       = require("./invSupplierRoutes");
const invProductRoutes        = require("./invProductRoutes");
const inventoryRoutes         = require("./inventoryRoutes");
const invoiceRoutes           = require("./invoiceRoutes");
const paymentRoutes           = require("./paymentRoutes");
const purchaseOrderRoutes     = require("./purchaseOrderRoutes");
const invoiceTemplateRoutes   = require("./invoiceTemplateRoutes");
const invoiceSettingsRoutes   = require("./invoiceSettingsRoutes");
const invDashboardRoutes      = require("./invDashboardRoutes");
const invReportsRoutes        = require("./invReportsRoutes");

const debugRoutes = require("./debugRoutes");

const router = express.Router();

router.use("/debug",              debugRoutes);
router.use("/auth",               authRoutes);
router.use("/admins",             adminRoutes);
router.use("/products",           productRoutes);
router.use("/categories",         categoryRoutes);
router.use("/seo-pages",          seoPageRoutes);
router.use("/quotes",             quoteRoutes);
router.use("/settings",           settingsRoutes);
router.use("/media",              mediaRoutes);
router.use("/contact",            contactRoutes);
router.use("/analytics",          analyticsRoutes);
router.use("/activity-logs",      activityLogRoutes);
router.use("/system-logs",        systemLogRoutes);
router.use("/brochures",          brochureRoutes);
router.use("/youtube",            youtubeRoutes);
router.use("/chat-sessions",      chatSessionRoutes);
router.use("/blog",               blogRoutes);
// Invoice & Inventory module
router.use("/inv/customers",      invCustomerRoutes);
router.use("/inv/suppliers",      invSupplierRoutes);
router.use("/inv/products",       invProductRoutes);
router.use("/inv/inventory",      inventoryRoutes);
router.use("/inv/invoices",       invoiceRoutes);
router.use("/inv/payments",       paymentRoutes);
router.use("/inv/purchase-orders", purchaseOrderRoutes);
router.use("/inv/templates",      invoiceTemplateRoutes);
router.use("/inv/settings",       invoiceSettingsRoutes);
router.use("/inv/dashboard",      invDashboardRoutes);
router.use("/inv/reports",        invReportsRoutes);

module.exports = router;
