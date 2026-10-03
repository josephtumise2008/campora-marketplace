const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Store = require("../models/Store");
const searchController = require("../controllers/searchController");
const metaController = require("../controllers/metaController");

const router = express.Router();

router.get("/search", searchController.search);
router.get("/universities", metaController.universities);
router.get("/config", metaController.config);

/** Lightweight home feed so the homepage renders in a single round trip. */
router.get("/home", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 24);
    const university = req.query.university ? String(req.query.university).toLowerCase() : "";

    let nearbyFilter = {};
    if (university) {
      const stores = await Store.find({ "location.universities": university, status: "active" })
        .select("_id")
        .lean();
      nearbyFilter = { store: { $in: stores.map((s) => s._id) } };
    }

    const productFields = "name slug price compareAtPrice images rating stock deal unit soldCount store category";

    const [categories, featuredStores, trending, deals, nearby, newArrivals, storeCounts] =
      await Promise.all([
        Category.find({ status: "active" }).sort({ order: 1 }).lean(),
        Store.find({ status: "active", featured: true })
          .sort({ "rating.average": -1 })
          .limit(6)
          .lean(),
        Product.find({ status: "active" })
          .sort({ soldCount: -1, "rating.average": -1 })
          .limit(limit)
          .select(productFields)
          .populate("store", "name slug logo rating verification")
          .populate("category", "name slug icon accent")
          .lean(),
        Product.find({ status: "active", "deal.isDeal": true })
          .sort({ "rating.average": -1 })
          .limit(8)
          .select(productFields)
          .populate("store", "name slug logo rating verification")
          .populate("category", "name slug icon accent")
          .lean(),
        Product.find({ status: "active", ...nearbyFilter })
          .sort({ "rating.average": -1, soldCount: -1 })
          .limit(8)
          .select(productFields)
          .populate("store", "name slug logo rating verification")
          .populate("category", "name slug icon accent")
          .lean(),
        Product.find({ status: "active" })
          .sort({ createdAt: -1 })
          .limit(8)
          .select(productFields)
          .populate("store", "name slug logo rating verification")
          .populate("category", "name slug icon accent")
          .lean(),
        Product.aggregate([
          { $match: { status: "active" } },
          { $group: { _id: "$store", count: { $sum: 1 } } },
        ]),
      ]);

    const countMap = new Map(storeCounts.map((row) => [row._id.toString(), row.count]));

    res.json({
      success: true,
      data: {
        categories,
        featuredStores: featuredStores.map((s) => ({
          ...s,
          stats: { ...s.stats, products: countMap.get(s._id.toString()) || 0 },
        })),
        trending,
        deals,
        nearby,
        newArrivals,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
