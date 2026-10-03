const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId, requireFields } = require("../middleware/validate");
const controller = require("../controllers/reviewController");

const router = express.Router();

router.get("/mine", protect, controller.mine);
router.get("/product/:productId", controller.forProduct);
router.get("/store/:storeId", validateObjectId("storeId"), controller.forStore);
router.post("/", protect, requireFields(["productId", "rating"]), controller.create);
router.patch("/:id", protect, validateObjectId("id"), controller.update);
router.delete("/:id", protect, validateObjectId("id"), controller.remove);

module.exports = router;
