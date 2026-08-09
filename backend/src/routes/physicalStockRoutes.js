const express = require("express");
const c = require("../controllers/physicalStockController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canRead   = authorizeRoles("super_admin", "admin", "manager", "inventory", "accounts", "billing");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "inventory");
const canDelete = authorizeRoles("super_admin", "admin");

router.use(protect);

router.get("/stats",          canRead,   c.getStats);
router.get("/export",         canRead,   c.exportCsv);
router.get("/",               canRead,   c.getAll);
router.get("/:id",            canRead,   validateObjectId(), c.getOne);
router.post("/bulk-import",   canWrite,  c.bulkImport);
router.post("/",              canWrite,  c.create);
router.put("/:id",            canWrite,  validateObjectId(), c.update);
router.delete("/:id",         canDelete, validateObjectId(), c.remove);
router.post("/:id/sell",      canWrite,  validateObjectId(), c.recordSale);
router.post("/:id/move",      canWrite,  validateObjectId(), c.moveStock);

module.exports = router;
