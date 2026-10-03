const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const controller = require("../controllers/storeController");

const router = express.Router();

router.get("/", controller.list);
router.get("/mine", protect, controller.mine);
router.patch("/mine", protect, controller.update);
router.post("/apply", protect, controller.apply);
router.post("/:id/follow", protect, validateObjectId("id"), controller.toggleFollow);
router.get("/:slug", controller.getByParam);
router.get("/id/:id", validateObjectId("id"), controller.getByParam);

module.exports = router;
