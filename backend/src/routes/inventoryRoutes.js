const express = require("express");
const c = require("../controllers/inventoryController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "inventory", "accounts");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "inventory");

router.use(protect);
router.get("/transactions",                   canAccess, c.getTransactions);
router.get("/transactions/:productId",        canAccess, validateObjectId("productId"), c.getProductTransactions);
router.get("/adjustments",                    canAccess, c.getAdjustments);
router.post("/adjustments",                   canWrite,  c.createAdjustment);

module.exports = router;
