const express = require("express");
const c = require("../controllers/invoiceController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "billing", "accounts");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "billing");
const canCancel = authorizeRoles("super_admin", "admin", "manager");

router.use(protect);
router.get("/stats",      canAccess, c.getInvoiceStats);
router.get("/",           canAccess, c.getInvoices);
router.get("/:id",        canAccess, validateObjectId(), c.getInvoiceById);
router.get("/:id/pdf",    canAccess, validateObjectId(), c.downloadInvoicePdf);
router.post("/",          canWrite,  c.createInvoice);
router.put("/:id",        canWrite,  validateObjectId(), c.updateInvoice);
router.post("/:id/cancel", canCancel, validateObjectId(), c.cancelInvoice);

module.exports = router;
