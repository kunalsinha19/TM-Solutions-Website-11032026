const express = require("express");
const productController = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", validateObjectId(), productController.getProductById);
router.post("/", protect, productController.createProduct);
router.put("/:id", protect, validateObjectId(), productController.updateProduct);
router.delete("/:id", protect, validateObjectId(), productController.deleteProduct);

module.exports = router;
