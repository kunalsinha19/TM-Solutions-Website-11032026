const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.registerAdmin);
router.post("/verify-email-otp", authController.verifyEmailOtp);
router.post("/login", authController.login);
router.post("/verify-login-otp", authController.verifyLoginOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", protect, authController.getProfile);

module.exports = router;
