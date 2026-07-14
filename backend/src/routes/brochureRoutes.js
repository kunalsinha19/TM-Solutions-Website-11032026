const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/brochureController");
const { protect } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

router.get("/",                                       ctrl.getBrochures);
router.get("/:id",          validateObjectId(),       ctrl.getBrochure);
router.post("/",            protect,                  ctrl.createBrochure);
router.put("/:id",          protect, validateObjectId(), ctrl.updateBrochure);
router.delete("/:id",       protect, validateObjectId(), ctrl.deleteBrochure);
router.post("/:id/download",         validateObjectId(), ctrl.trackDownload);

module.exports = router;
