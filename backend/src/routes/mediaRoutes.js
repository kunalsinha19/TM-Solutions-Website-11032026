const express = require("express");
const { uploadLogo } = require("../controllers/mediaController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/upload", protect, uploadLogo);

module.exports = router;
