const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.use(protect, authorizeRoles("super_admin"));
router.get("/", adminController.getAdmins);
router.post("/", adminController.createAdmin);
router.put("/:id", validateObjectId(), adminController.updateAdmin);
router.delete("/:id", validateObjectId(), adminController.deleteAdmin);

module.exports = router;
