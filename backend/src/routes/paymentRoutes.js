const express = require("express");
const c = require("../controllers/paymentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "billing", "accounts");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "billing");
const canCancel = authorizeRoles("super_admin", "admin");

router.use(protect);
router.get("/",           canAccess, c.getPayments);
router.get("/:id",        canAccess, validateObjectId(), c.getPaymentById);
router.post("/",          canWrite,  c.createPayment);
router.post("/:id/cancel", canCancel, validateObjectId(), c.cancelPayment);

module.exports = router;
