const express = require("express");
const settingsController = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");
const { validateSettingsPayload } = require("../middleware/validateSettingsPayload");

const router = express.Router();

router.get("/", settingsController.getSettings);
router.post("/", protect, validateSettingsPayload, settingsController.createSettings);
router.put("/", protect, validateSettingsPayload, settingsController.updateSettings);
router.patch("/", protect, validateSettingsPayload, settingsController.updateSettings);
router.delete("/", protect, settingsController.deleteSettings);

module.exports = router;
