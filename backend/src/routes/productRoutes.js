const express = require("express");
const { protect, requireSeller } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");const controller = require("../controllers/productController");

const router = express.Router();

router.get("/", controller.list);
router.get("/facets", controller.facets);
router.get("/mine", protect, requireSeller, controller.mine);
router.get("/:id", validateObjectId("id"), controller.getById);
router.post("/", protect, requireSeller, controller.create);
router.patch("/:id", protect, requireSeller, validateObjectId("id"), controller.update);
router.delete("/:id", protect, requireSeller, validateObjectId("id"), controller.remove);

module.exports = router;
