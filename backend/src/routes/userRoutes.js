const express = require("express");
const { protect } = require("../middleware/auth");
const { validateObjectId, requireFields } = require("../middleware/validate");
const controller = require("../controllers/userController");

const router = express.Router();

router.get("/addresses", protect, controller.listAddresses);
router.post("/addresses", protect, requireFields(["recipient", "line1", "city", "state", "zip"]), controller.createAddress);
router.patch("/addresses/:id", protect, validateObjectId("id"), controller.updateAddress);
router.delete("/addresses/:id", protect, validateObjectId("id"), controller.removeAddress);

router.get("/wishlist", protect, controller.getWishlist);
router.post("/wishlist/:id", protect, validateObjectId("id"), controller.toggleWishlist);

router.get("/favorites", protect, controller.getFavorites);
router.post("/favorites/:id", protect, validateObjectId("id"), controller.toggleFavoriteStore);

router.get("/searches", protect, (req, res) => res.json({ success: true, data: { recentSearches: req.user.recentSearches || [] } }));
router.post("/searches", protect, controller.pushRecentSearch);
router.delete("/searches", protect, controller.clearRecentSearches);

router.get("/notifications", protect, controller.getNotifications);
router.patch("/notifications/read", protect, controller.markNotificationsRead);

module.exports = router;
