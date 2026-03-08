const express = require("express");
const seoPageController = require("../controllers/seoPageController");
const { protect } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.get("/", seoPageController.getSeoPages);
router.get("/:id", validateObjectId(), seoPageController.getSeoPageById);
router.post("/", protect, seoPageController.createSeoPage);
router.put("/:id", protect, validateObjectId(), seoPageController.updateSeoPage);
router.delete("/:id", protect, validateObjectId(), seoPageController.deleteSeoPage);

module.exports = router;
