const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const controller = require("../controllers/categoryController");

const router = express.Router();

router.get("/", controller.list);
router.get("/:slug", controller.getBySlug);

router.post("/", protect, authorize("admin"), controller.create);
router.patch("/:id", protect, authorize("admin"), validateObjectId("id"), controller.update);
router.delete("/:id", protect, authorize("admin"), validateObjectId("id"), controller.remove);

module.exports = router;
