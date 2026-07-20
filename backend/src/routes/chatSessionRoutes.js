const express = require("express");
const ctrl    = require("../controllers/chatSessionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/",     ctrl.upsert);          // public — frontend saves sessions
router.get("/",      protect, ctrl.list);   // admin only
router.get("/:id",   protect, ctrl.getOne); // admin only

module.exports = router;
