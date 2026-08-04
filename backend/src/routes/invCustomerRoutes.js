const express = require("express");
const c = require("../controllers/customerController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "billing", "accounts");
const canWrite  = authorizeRoles("super_admin", "admin", "manager", "billing");
const canDelete = authorizeRoles("super_admin", "admin");

router.use(protect);
router.get("/",     canAccess, c.getCustomers);
router.get("/:id",  canAccess, validateObjectId(), c.getCustomerById);
router.post("/",    canWrite,  c.createCustomer);
router.put("/:id",  canWrite,  validateObjectId(), c.updateCustomer);
router.delete("/:id", canDelete, validateObjectId(), c.deleteCustomer);

module.exports = router;
