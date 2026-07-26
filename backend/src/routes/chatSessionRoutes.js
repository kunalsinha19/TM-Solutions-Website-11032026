const express = require("express");
const ctrl    = require("../controllers/chatSessionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/",       ctrl.upsert);          // public — frontend saves sessions
router.get("/stats",   protect, ctrl.stats);  // admin analytics
router.get("/",        protect, ctrl.list);   // admin list
router.get("/:id",     protect, ctrl.getOne); // admin detail

module.exports = router;
