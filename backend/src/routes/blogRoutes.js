const express  = require("express");
const ctrl     = require("../controllers/blogController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.get("/",                   ctrl.list);

// Admin (protected) — must be before /:slug to avoid being swallowed
router.get("/admin/all",          protect, ctrl.adminList);
router.post("/seed-demo",         protect, ctrl.seedDemo);
router.post("/",                  protect, ctrl.create);
router.put("/:id",                protect, ctrl.update);
router.delete("/:id",             protect, ctrl.remove);

// Public slug lookup — last so it doesn't catch named routes above
router.get("/:slug",              ctrl.getBySlug);

module.exports = router;
