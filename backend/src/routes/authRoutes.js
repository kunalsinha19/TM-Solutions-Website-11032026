const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register",     authController.registerAdmin);
router.post("/login",        authController.login);
router.post("/logout",       protect, authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password",  authController.resetPassword);
router.get("/me",            protect, authController.getProfile);

// OTP-based login — used by the Next.js invoice module (/api/v1/auth/*)
router.post("/request-otp",  authController.requestOtp);
router.post("/verify-otp",   authController.verifyOtp);

module.exports = router;
