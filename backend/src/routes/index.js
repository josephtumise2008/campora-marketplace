const express = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const storeRoutes = require("./storeRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const orderRoutes = require("./orderRoutes");
const reviewRoutes = require("./reviewRoutes");
const sellerRoutes = require("./sellerRoutes");
const adminRoutes = require("./adminRoutes");
const metaRoutes = require("./metaRoutes");
const uploadRoutes = require("./uploadRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/stores", storeRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/seller", sellerRoutes);
router.use("/admin", adminRoutes);
router.use("/uploads", uploadRoutes);
router.use("/", metaRoutes);

module.exports = router;
