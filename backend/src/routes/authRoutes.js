const express = require("express");
const { validateEmail, validatePassword, requireFields } = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/authController");

const router = express.Router();

router.post("/register", requireFields(["name", "email", "password"]), validateEmail, validatePassword, controller.register);
router.post("/login", requireFields(["email", "password"]), validateEmail, controller.login);
router.post("/forgot-password", requireFields(["email"]), validateEmail, controller.forgotPassword);
router.get("/me", protect, controller.me);
router.patch("/me", protect, controller.updateProfile);
router.patch("/password", protect, requireFields(["newPassword"]), validatePassword, controller.changePassword);

module.exports = router;
