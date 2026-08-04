const express = require("express");
const c = require("../controllers/invoiceSettingsController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/",  authorizeRoles("super_admin", "admin", "manager", "billing", "inventory", "accounts"), c.getSettings);
router.put("/",  authorizeRoles("super_admin", "admin"), c.updateSettings);

module.exports = router;
