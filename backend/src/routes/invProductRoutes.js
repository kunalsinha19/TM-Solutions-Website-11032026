const express = require("express");
const c = require("../controllers/invProductController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess   = authorizeRoles("super_admin", "admin", "manager", "billing", "inventory", "accounts");
const canWrite    = authorizeRoles("super_admin", "admin", "manager", "inventory");
const canDelete   = authorizeRoles("super_admin", "admin");

router.use(protect);
router.get("/categories", canAccess, c.getCategories);
router.get("/low-stock",  canAccess, c.getLowStockProducts);
router.get("/",           canAccess, c.getProducts);
router.get("/:id",        canAccess, validateObjectId(), c.getProductById);
router.post("/",          canWrite,  c.createProduct);
router.put("/:id",        canWrite,  validateObjectId(), c.updateProduct);
router.delete("/:id",     canDelete, validateObjectId(), c.deleteProduct);

module.exports = router;
