const Order = require("../models/Order");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");

const round2 = (n) => Math.round(n * 100) / 100;

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

const buildSeries = (orders, days) => {
  const series = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    series.push({ date: dayKey(d), revenue: 0, orders: 0 });
  }
  const index = new Map(series.map((row, i) => [row.date, i]));
  orders.forEach((order) => {
    const key = dayKey(order.placedAt || order.createdAt);
    if (index.has(key)) {
      series[index.get(key)].revenue += order.storeSubtotal ?? order.totals.subtotal;
      series[index.get(key)].orders += 1;
    }
  });
  return series.map((row) => ({ ...row, revenue: round2(row.revenue) }));
};

const dashboard = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id }).lean();
  if (!store) throw ApiError.forbidden("Finish setting up your store to open the seller dashboard");

  const now = new Date();
  const startOfWindow = new Date(now);
  startOfWindow.setDate(now.getDate() - 29);
  const startOfPrevious = new Date(now);
  startOfPrevious.setDate(now.getDate() - 59);

  const [orders, products, lowStock, reviewAgg] = await Promise.all([
    Order.find({ "items.store": store._id })
      .sort({ createdAt: -1 })
      .populate("customer", "name email avatar")
      .lean(),
    Product.find({ store: store._id, status: "active" })
      .select("name price images stock soldCount rating status category")
      .populate("category", "name slug")
      .lean(),
    Product.find({ store: store._id, status: "active", stock: { $lte: 12 } })
      .select("name stock images")
      .sort({ stock: 1 })
      .limit(8)
      .lean(),
    Review.aggregate([
      { $match: { store: store._id, status: "published" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  const shaped = orders.map((order) => {
    const items = order.items.filter((item) => item.store.toString() === store._id.toString());
    return { ...order, items, storeSubtotal: round2(items.reduce((s, i) => s + i.lineTotal, 0)) };
  });

  const inWindow = shaped.filter((o) => new Date(o.placedAt || o.createdAt) >= startOfWindow);
  const previous = shaped.filter((o) => {
    const d = new Date(o.placedAt || o.createdAt);
    return d >= startOfPrevious && d < startOfWindow;
  });

  const sum = (rows) => round2(rows.reduce((s, o) => s + o.storeSubtotal, 0));
  const revenue30 = sum(inWindow);
  const revenuePrev = sum(previous);
  const orders30 = inWindow.length;

  const topProducts = [...products]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 6);

  const productRevenue = {};
  shaped.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.product.toString();
      productRevenue[key] = (productRevenue[key] || 0) + item.lineTotal;
    });
  });

  const topRevenue = products
    .map((p) => ({ ...p, revenue: round2(productRevenue[p._id.toString()] || 0) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const uniqueCustomers = new Set(shaped.map((o) => o.customer?._id?.toString()).filter(Boolean));
  const totalReviews = reviewAgg.reduce((s, r) => s + r.count, 0);
  const weighted = reviewAgg.reduce((s, r) => s + r._id * r.count, 0);

  res.json({
    success: true,
    data: {
      store,
      stats: {
        revenue30,
        revenuePrevious: revenuePrev,
        revenueChange: revenuePrev > 0 ? Math.round(((revenue30 - revenuePrev) / revenuePrev) * 100) : revenue30 > 0 ? 100 : 0,
        orders30,
        ordersChange: previous.length > 0 ? Math.round(((orders30 - previous.length) / previous.length) * 100) : orders30 > 0 ? 100 : 0,
        products: products.length,
        customers: uniqueCustomers.size,
        averageOrderValue: orders30 > 0 ? round2(revenue30 / orders30) : 0,
        averageOrderValuePrevious: previous.length > 0 ? round2(revenuePrev / previous.length) : 0,
        rating: totalReviews > 0 ? Math.round((weighted / totalReviews) * 10) / 10 : store.rating.average,
        reviewCount: totalReviews,
        repeatRate: uniqueCustomers.size > 0 ? Math.round(((uniqueCustomers.size - 1) / uniqueCustomers.size) * 100) : 0,
      },
      series: buildSeries(shaped, 30),
      topProducts: topRevenue.length ? topRevenue : topProducts,
      lowStock,
      recentOrders: shaped.slice(0, 6),
      customers: Array.from(uniqueCustomers).slice(0, 5).map((id) => {
        const order = shaped.find((o) => o.customer?._id?.toString() === id);
        return {
          id,
          name: order?.customer?.name || "Customer",
          email: order?.customer?.email || "",
          avatar: order?.customer?.avatar || "",
          orders: shaped.filter((o) => o.customer?._id?.toString() === id).length,
          spend: round2(
            shaped
              .filter((o) => o.customer?._id?.toString() === id)
              .reduce((s, o) => s + o.storeSubtotal, 0)
          ),
        };
      }),
    },
  });
};

const customers = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw ApiError.forbidden("You do not have a store yet");

  const orders = await Order.find({ "items.store": store._id }).sort({ createdAt: -1 }).lean();
  const map = new Map();

  orders.forEach((order) => {
    const key = order.customer.toString();
    const existing = map.get(key) || {
      id: key,
      name: "Customer",
      email: "",
      orders: 0,
      spend: 0,
      lastOrderAt: order.createdAt,
    };
    existing.orders += 1;
    existing.spend += order.items
      .filter((i) => i.store.toString() === store._id.toString())
      .reduce((s, i) => s + i.lineTotal, 0);
    if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
      existing.lastOrderAt = order.createdAt;
    }
    map.set(key, existing);
  });

  const ids = [...map.keys()];
  const users = await User.find({ _id: { $in: ids } }).select("name email avatar").lean();
  const rows = users.map((user) => ({
    ...map.get(user._id.toString()),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    averageOrderValue: round2(map.get(user._id.toString()).spend / map.get(user._id.toString()).orders),
  }));

  res.json({
    success: true,
    data: {
      items: rows.sort((a, b) => b.spend - a.spend),
      summary: {
        total: rows.length,
        repeat: rows.filter((r) => r.orders > 1).length,
        averageOrderValue: rows.length ? round2(rows.reduce((s, r) => s + r.spend, 0) / rows.length) : 0,
        lifetimeValue: round2(rows.reduce((s, r) => s + r.spend, 0)),
      },
    },
  });
};

module.exports = { dashboard, customers };
