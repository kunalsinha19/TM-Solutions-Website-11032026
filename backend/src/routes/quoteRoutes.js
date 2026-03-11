const express = require("express");
const quoteController = require("../controllers/quoteController");
const { protect } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.post("/", quoteController.createQuoteRequest);
router.get("/", protect, quoteController.getQuoteRequests);
router.get("/:id", protect, validateObjectId(), quoteController.getQuoteRequestById);
router.put("/:id", protect, validateObjectId(), quoteController.updateQuoteRequest);
router.post("/:id/reply", protect, validateObjectId(), quoteController.replyToQuoteRequest);

module.exports = router;
