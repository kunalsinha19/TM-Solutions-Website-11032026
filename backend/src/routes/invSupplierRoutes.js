const express = require("express");
const c = require("../controllers/supplierController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "inventory", "accounts");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "inventory");
const canDelete = authorizeRoles("super_admin", "admin");

router.use(protect);
router.get("/",     canAccess, c.getSuppliers);
router.get("/:id",  canAccess, validateObjectId(), c.getSupplierById);
router.post("/",    canWrite,  c.createSupplier);
router.put("/:id",  canWrite,  validateObjectId(), c.updateSupplier);
router.delete("/:id", canDelete, validateObjectId(), c.deleteSupplier);

module.exports = router;
