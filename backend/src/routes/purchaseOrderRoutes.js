const express = require("express");
const c = require("../controllers/purchaseOrderController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "inventory", "accounts");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "inventory");
const canCancel = authorizeRoles("super_admin", "admin", "manager");

router.use(protect);
router.get("/",              canAccess, c.getPurchaseOrders);
router.get("/:id",           canAccess, validateObjectId(), c.getPurchaseOrderById);
router.post("/",             canWrite,  c.createPurchaseOrder);
router.put("/:id",           canWrite,  validateObjectId(), c.updatePurchaseOrder);
router.post("/:id/receive",  canWrite,  validateObjectId(), c.receiveOrder);
router.post("/:id/cancel",   canCancel, validateObjectId(), c.cancelOrder);

module.exports = router;
