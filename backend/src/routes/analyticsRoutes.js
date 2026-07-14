const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

// Public — called from the main website
router.post("/track",              ctrl.trackVisitor);
router.put("/track/:sessionId",    ctrl.updateSession);

// Protected — admin dashboard only
router.get("/summary",    protect, ctrl.getSummary);
router.get("/visitors",   protect, ctrl.getVisitors);
router.get("/live",       protect, ctrl.getLiveVisitors);

module.exports = router;
