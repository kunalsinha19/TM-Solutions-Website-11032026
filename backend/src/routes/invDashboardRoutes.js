const express = require("express");
const c = require("../controllers/invDashboardController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "billing", "inventory", "accounts");

router.use(protect, canAccess);
router.get("/",           c.getDashboard);
router.get("/chart",      c.getRevenueChart);

module.exports = router;
