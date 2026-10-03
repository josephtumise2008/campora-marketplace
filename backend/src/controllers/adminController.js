const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");
const { getPagination, paginated } = require("../utils/pagination");

const round2 = (n) => Math.round(n * 100) / 100;

const overview = async (_req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [users, sellers, stores, verifiedStores, pendingStores, products, orders, revenueAgg, recentOrders, recentUsers, topStores, categories, reviewAgg] =
    await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "seller" }),
      Store.countDocuments(),
      Store.countDocuments({ verification: "verified" }),
      Store.countDocuments({ verification: "pending" }),
      Product.countDocuments({ status: "active" }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$totals.total" }, fees: { $sum: "$totals.serviceFee" } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).populate("customer", "name avatar").lean(),
      User.find().sort({ createdAt: -1 }).limit(6).select("name email role avatar createdAt university").lean(),
      Store.find({ status: "active" }).sort({ "stats.revenue": -1 }).limit(6).select("name slug logo rating verification stats location").lean(),
      Category.find().sort({ order: 1 }).select("name slug productCount icon accent status").lean(),
      Review.aggregate([{ $match: { status: "published" } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]),
    ]);

  const seriesAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totals.total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const series = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const match = seriesAgg.find((row) => row._id === key);
    series.push({ date: key, revenue: round2(match?.revenue || 0), orders: match?.orders || 0 });
  }

  const byStatus = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const topCategories = await Product.aggregate([
    { $match: { status: "active" } },
    {
      $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" },
    },
    { $unwind: "$category" },
    { $group: { _id: "$category.name", slug: { $first: "$category.slug" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        customers: users,
        sellers,
        stores,
        verifiedStores,
        pendingStores,
        products,
        orders,
        revenue: round2(revenueAgg[0]?.revenue || 0),
        platformFees: round2(revenueAgg[0]?.fees || 0),
        averageOrderValue: orders > 0 ? round2((revenueAgg[0]?.revenue || 0) / orders) : 0,
        reviews: reviewAgg.reduce((s, r) => s + r.count, 0),
      },
      series,
      recentOrders,
      recentUsers,
      topStores,
      categories,
      ordersByStatus: byStatus,
      topCategories,
    },
  });
};

const listUsers = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 30);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("name email role avatar university isActive createdAt lastLoginAt store").populate("store", "name slug logo verification").lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginated(items, total, { page, limit }) });
};

const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  if (req.body.role) {
    if (!["customer", "seller", "admin"].includes(req.body.role)) {
      throw ApiError.badRequest("That role is not recognised");
    }
    user.role = req.body.role;
  }
  if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
  await user.save();

  res.json({ success: true, data: { user } });
};

const listStores = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 30);
  const filter = {};
  if (req.query.verification) filter.verification = req.query.verification;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { "location.city": rx }];
  }

  const [items, total] = await Promise.all([
    Store.find(filter)
      .sort({ verification: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("owner", "name email avatar")
      .lean(),
    Store.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginated(items, total, { page, limit }) });
};

const updateStoreVerification = async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw ApiError.notFound("Store not found");

  const { verification, status, featured } = req.body;
  if (verification) {
    if (!["pending", "verified", "suspended"].includes(verification)) {
      throw ApiError.badRequest("That verification state is not recognised");
    }
    store.verification = verification;
    if (verification === "suspended") store.status = "paused";
    if (verification === "verified") store.status = "active";
  }
  if (status) store.status = status;
  if (featured !== undefined) store.featured = Boolean(featured);
  await store.save();

  const owner = await User.findById(store.owner);
  if (owner) {
    const Notification = require("../models/Notification");
    await Notification.create({
      user: owner._id,
      type: "seller",
      title: `Store ${verification === "verified" ? "approved" : verification === "suspended" ? "suspended" : "moved back to review"}`,
      body: `An administrator updated ${store.name} to ${verification}.`,
      link: "/seller",
    });
  }

  res.json({ success: true, data: { store } });
};

const listProducts = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 30);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.store) filter.store = req.query.store;
  if (req.query.q) filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("store", "name slug logo")
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginated(items, total, { page, limit }) });
};

const listOrders = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 30);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.orderNumber = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("customer", "name email avatar").populate("items.store", "name slug").lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginated(items, total, { page, limit }) });
};

const reports = async (_req, res) => {
  const [categoryBreakdown, storePerformance, statusBreakdown, topSellers, revenueByDay] = await Promise.all([
    Product.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" }, units: { $sum: "$soldCount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $sort: { count: -1 } },
    ]),
    Store.aggregate([
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          slug: { $first: "$slug" },
          logo: { $first: "$logo" },
          verification: { $first: "$verification" },
          orders: { $sum: "$stats.orders" },
          revenue: { $sum: "$stats.revenue" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$totals.total" } } }, { $sort: { count: -1 } }]),
    Product.aggregate([
      { $match: { status: "active" } },
      { $sort: { soldCount: -1 } },
      { $limit: 8 },
      { $project: { name: 1, images: 1, price: 1, soldCount: 1, "store": 1 } },
      { $lookup: { from: "stores", localField: "store", foreignField: "_id", as: "store" } },
      { $unwind: "$store" },
      { $project: { name: 1, images: 1, price: 1, soldCount: 1, "store.name": 1, "store.slug": 1, "store.logo": 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 29 * 24 * 3600 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totals.total" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      categoryBreakdown: categoryBreakdown.map((row) => ({
        name: row.category.name,
        slug: row.category.slug,
        products: row.count,
        units: row.units,
        averagePrice: round2(row.avgPrice || 0),
      })),
      storePerformance,
      statusBreakdown: statusBreakdown.map((row) => ({ ...row, total: round2(row.total) })),
      topSellers,
      revenueByDay,
    },
  });
};

/**
 * Admin support override. Sellers normally drive order status through
 * /orders/:id/status; admins can step in when a store goes quiet, and the
 * override is written into the order timeline with a clear note.
 */
const STATUS_LABELS = {
  Pending: "Order placed",
  Confirmed: "Seller confirmed",
  Preparing: "Being prepared",
  Ready: "Ready for pickup or delivery",
  "Out for Delivery": "Out for delivery",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  const next = req.body.status;
  if (!STATUS_LABELS[next]) throw ApiError.badRequest("That order status is not recognised");
  if (order.status === next) throw ApiError.badRequest(`This order is already ${next.toLowerCase()}`);

  order.status = next;
  order.items.forEach((item) => {
    item.status = next;
  });
  order.timeline.push({
    status: next,
    label: STATUS_LABELS[next],
    note: req.body.note || `Updated by Campora support (${req.user.email})`,
    at: new Date(),
  });
  if (next === "Delivered") order.deliveredAt = new Date();
  await order.save();

  res.json({ success: true, data: { order } });
};

module.exports = {
  overview,
  listUsers,
  updateUser,
  listStores,
  updateStoreVerification,
  listProducts,
  listOrders,
  updateOrderStatus,
  reports,
};
