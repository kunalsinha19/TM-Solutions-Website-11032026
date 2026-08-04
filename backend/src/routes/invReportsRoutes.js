const express = require("express");
const c = require("../controllers/invReportsController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "billing", "accounts");

router.use(protect, canAccess);
router.get("/sales",              c.getSalesReport);
router.get("/gst",                c.getGSTReport);
router.get("/receivables",        c.getReceivablesReport);
router.get("/inventory",          c.getInventoryReport);
router.get("/ledger/:customerId", validateObjectId("customerId"), c.getCustomerLedger);

module.exports = router;
