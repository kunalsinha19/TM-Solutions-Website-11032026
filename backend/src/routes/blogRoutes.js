const express  = require("express");
const ctrl     = require("../controllers/blogController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.get("/",           ctrl.list);
router.get("/:slug",      ctrl.getBySlug);

// Admin (protected)
router.get("/admin/all",  protect, ctrl.adminList);
router.post("/",          protect, ctrl.create);
router.put("/:id",        protect, ctrl.update);
router.delete("/:id",     protect, ctrl.remove);

module.exports = router;
