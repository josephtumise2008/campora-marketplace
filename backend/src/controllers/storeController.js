const Store = require("../models/Store");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");
const User = require("../models/User");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const { getPagination, paginated } = require("../utils/pagination");

const list = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 40);
  const filter = { status: "active" };

  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { tagline: rx }, { description: rx }];
  }
  if (req.query.category) {
    const category = await Category.findOne({ slug: String(req.query.category).toLowerCase() }).lean();
    if (!category) throw ApiError.notFound("That category does not exist");
    filter.categories = category._id;
  }
  if (req.query.university) {
    filter["location.universities"] = String(req.query.university).toLowerCase();
  }
  if (req.query.verified === "true") filter.verification = "verified";
  if (req.query.minRating) filter["rating.average"] = { $gte: Number(req.query.minRating) };
  if (req.query.freeDelivery === "true") filter["delivery.fee"] = 0;

  const sorts = {
    recommended: { featured: -1, "rating.average": -1, "rating.count": -1 },
    rating: { "rating.average": -1 },
    reviews: { "rating.count": -1 },
    newest: { createdAt: -1 },
    "name-asc": { name: 1 },
  };
  const sort = sorts[req.query.sort] || sorts.recommended;

  const [items, total] = await Promise.all([
    Store.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Store.countDocuments(filter),
  ]);

  const withCounts = await Promise.all(
    items.map(async (store) => ({
      ...store,
      stats: {
        ...store.stats,
        products: await Product.countDocuments({ store: store._id, status: "active" }),
      },
    }))
  );

  res.json({ success: true, data: paginated(withCounts, total, { page, limit }) });
};

const getByParam = async (req, res) => {
  const { id, slug } = req.params;
  const query = slug ? { slug: String(slug).toLowerCase() } : { _id: id };
  const store = await Store.findOne(query)
    .populate("category", "name slug icon accent")
    .populate("categories", "name slug icon accent")
    .populate("owner", "name avatar")
    .lean();

  if (!store) throw ApiError.notFound("That store is not available on Campora");

  const { page, limit, skip } = getPagination(req.query, 24);
  const productFilter = { store: store._id, status: "active" };
  if (req.query.q) {
    productFilter.name = new RegExp(
      String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }
  if (req.query.category) {
    const category = await Category.findOne({ slug: String(req.query.category).toLowerCase() }).lean();
    if (category) productFilter.category = category._id;
  }

  const sortMap = {
    recommended: { featured: -1, soldCount: -1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    rating: { "rating.average": -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.recommended;

  const [products, total, reviews, categoryRows] = await Promise.all([
    Product.find(productFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug icon accent")
      .lean(),
    Product.countDocuments(productFilter),
    Review.find({ store: store._id, status: "published" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name avatar")
      .populate("product", "name")
      .lean(),
    Product.aggregate([
      { $match: { store: store._id, status: "active" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
          icon: "$category.icon",
          accent: "$category.accent",
          count: 1,
        },
      },
    ]),
  ]);

  const ratingBuckets = await Review.aggregate([
    { $match: { store: store._id, status: "published" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      store,
      products: paginated(products, total, { page, limit }),
      reviews,
      ratingBuckets,
      storeCategories: categoryRows,
    },
  });
};

const mine = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id }).lean();
  if (!store) throw ApiError.notFound("You do not have a store yet");
  const [productCount, reviewCount] = await Promise.all([
    Product.countDocuments({ store: store._id, status: "active" }),
    Review.countDocuments({ store: store._id, status: "published" }),
  ]);
  res.json({ success: true, data: { store: { ...store, stats: { ...store.stats, products: productCount, reviews: reviewCount } } } });
};

const update = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw ApiError.notFound("You do not have a store yet");

  const allowed = ["name", "tagline", "description", "logo", "cover", "hours", "policies", "promo", "contact"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) store[field] = req.body[field];
  });

  if (req.body.location) {
    store.location = { ...store.location, ...req.body.location };
  }
  if (req.body.delivery) {
    store.delivery = { ...store.delivery, ...req.body.delivery };
    if (store.delivery.methods?.length === 0) store.delivery.methods = ["Pickup"];
  }
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (category) store.category = category._id;
  }
  if (req.body.categories) {
    const categories = await Category.find({ _id: { $in: req.body.categories } });
    if (categories.length) store.categories = categories.map((c) => c._id);
  }

  await store.save();
  res.json({ success: true, data: { store } });
};

/** Let a signed-in shopper apply to run a store on their existing account. */
const apply = async (req, res) => {
  const existing = await Store.findOne({ owner: req.user._id });
  if (existing) throw ApiError.conflict("You already run a store on Campora");

  const businessName = String(req.body.businessName || "").trim();
  if (!businessName) throw ApiError.badRequest("Give your store a name");

  const category = await Category.findOne({ slug: String(req.body.category || "services").toLowerCase() });
  const store = await Store.create({
    name: businessName,
    slug: `${businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`,
    tagline: String(req.body.tagline || "").trim(),
    description: String(req.body.description || "").trim(),
    logo: req.body.logo || "",
    cover: req.body.cover || "",
    category: category?._id,
    categories: category ? [category._id] : [],
    owner: req.user._id,
    verification: "pending",
    status: "active",
    location: {
      city: String(req.body.city || "").trim(),
      state: String(req.body.state || "").trim(),
      address: String(req.body.address || "").trim(),
      zip: String(req.body.zip || "").trim(),
      universities: [req.body.university].filter(Boolean),
    },
    contact: { email: req.user.email, phone: String(req.body.phone || req.user.phone || "") },
    delivery: {
      fee: 2.99,
      freeThreshold: 35,
      etaMinutes: Number(req.body.etaMinutes) || 40,
      methods: req.body.deliveryMethods?.length ? req.body.deliveryMethods : ["Delivery", "Pickup"],
    },
  });

  req.user.role = "seller";
  req.user.store = store._id;
  await req.user.save();

  await Notification.create({
    user: req.user._id,
    type: "system",
    title: "Store application received",
    body: `${store.name} is with the Campora team. Your dashboard opens as soon as an admin approves it.`,
    link: "/seller",
  });

  const admins = await User.find({ role: "admin", isActive: true }).select("_id");
  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        type: "system",
        title: "Store application to review",
        body: `${store.name} submitted a store application for Campora verification.`,
        link: "/admin/stores",
      }))
    );
  }

  res.status(201).json({ success: true, data: { store } });
};

const toggleFollow = async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw ApiError.notFound("Store not found");

  const user = await User.findById(req.user._id);
  const index = user.favoriteStores.findIndex((entry) => entry.toString() === store._id.toString());
  if (index >= 0) {
    user.favoriteStores.splice(index, 1);
  } else {
    user.favoriteStores.push(store._id);
  }
  await user.save();
  res.json({
    success: true,
    data: { following: index < 0, favoriteStores: user.favoriteStores },
  });
};

module.exports = { list, getByParam, mine, update, apply, toggleFollow };
