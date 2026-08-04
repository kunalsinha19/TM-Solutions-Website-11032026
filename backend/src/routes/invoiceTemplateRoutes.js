const express = require("express");
const c = require("../controllers/invoiceTemplateController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();
const canAccess = authorizeRoles("super_admin", "admin", "manager", "billing");
const canWrite  = authorizeRoles("super_admin", "admin");

router.use(protect);
router.get("/",                  canAccess, c.getTemplates);
router.get("/:id",               canAccess, validateObjectId(), c.getTemplateById);
router.post("/",                 canWrite,  c.createTemplate);
router.put("/:id",               canWrite,  validateObjectId(), c.updateTemplate);
router.delete("/:id",            canWrite,  validateObjectId(), c.deleteTemplate);
router.post("/:id/set-default",  canWrite,  validateObjectId(), c.setDefault);

module.exports = router;
