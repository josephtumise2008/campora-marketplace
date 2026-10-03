const express = require("express");
const { protect, requireSeller } = require("../middleware/auth");
const controller = require("../controllers/sellerController");

const router = express.Router();

router.get("/dashboard", protect, requireSeller, controller.dashboard);
router.get("/customers", protect, requireSeller, controller.customers);

module.exports = router;
