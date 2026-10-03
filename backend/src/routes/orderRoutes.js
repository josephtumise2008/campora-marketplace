const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId, requireFields } = require("../middleware/validate");
const controller = require("../controllers/orderController");

const router = express.Router();

router.post("/quote", controller.quote);
router.post("/", protect, controller.create);
router.get("/mine", protect, controller.listMine);
router.get("/store", protect, controller.storeOrders);
router.patch("/:id/status", protect, requireFields(["status"]), validateObjectId("id"), controller.updateStatus);
router.get("/:id", protect, validateObjectId("id"), controller.getMine);
router.patch("/:id/cancel", protect, validateObjectId("id"), controller.cancel);

module.exports = router;
