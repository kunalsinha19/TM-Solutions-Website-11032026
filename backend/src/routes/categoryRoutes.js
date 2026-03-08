const express = require("express");
const categoryController = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.get("/", categoryController.getCategories);
router.get("/:id", validateObjectId(), categoryController.getCategoryById);
router.post("/", protect, categoryController.createCategory);
router.put("/:id", protect, validateObjectId(), categoryController.updateCategory);
router.delete("/:id", protect, validateObjectId(), categoryController.deleteCategory);

module.exports = router;
