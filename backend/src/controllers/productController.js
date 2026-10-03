const Product = require("../models/Product");
const Category = require("../models/Category");
const Store = require("../models/Store");
const ApiError = require("../utils/ApiError");
const { getPagination, paginated } = require("../utils/pagination");

const PRODUCT_FIELDS = "name slug price images rating stock store category compareAtPrice deal unit tags soldCount status";

const SORTS = {
  recommended: { featured: -1, "rating.average": -1, soldCount: -1 },
  popular: { soldCount: -1, "rating.count": -1 },
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  rating: { "rating.average": -1, "rating.count": -1 },
  deals: { "deal.isDeal": -1, price: 1 },
};

const resolveCategory = async (value) => {
  if (!value) return null;
  const found = await Category.findOne({
    $or: [{ slug: String(value).toLowerCase() }, ...(/^[a-f\d]{24}$/i.test(value) ? [{ _id: value }] : [])],
  }).lean();
  return found?._id || null;
};

const resolveStore = async (value) => {
  if (!value) return null;
  const found = await Store.findOne({
    $or: [{ slug: String(value).toLowerCase() }, ...(/^[a-f\d]{24}$/i.test(value) ? [{ _id: value }] : [])],
  }).lean();
  return found?._id || null;
};

const buildFilter = async (query) => {
  const filter = { status: "active" };

  if (query.q) {
    const safe = String(query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
  }

  const categoryIds = [];
  if (query.category) categoryIds.push(await resolveCategory(query.category));
  if (query.excludeCategory) {
    const excluded = await resolveCategory(query.excludeCategory);
    filter.category = { $ne: excluded };
  }
  if (categoryIds[0]) filter.category = categoryIds[0];

  if (query.store) filter.store = await resolveStore(query.store);
  if (query.featured === "true") filter.featured = true;
  if (query.deals === "true") filter["deal.isDeal"] = true;
  if (query.inStock === "true") filter.stock = { $gt: 0 };

  if (query.university) {
    const stores = await Store.find({ "location.universities": String(query.university).toLowerCase() })
      .select("_id")
      .lean();
    filter.store = { $in: stores.map((s) => s._id) };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.minRating) {
    filter["rating.average"] = { $gte: Number(query.minRating) };
  }

  if (query.delivery === "pickup") {
    const stores = await Store.find({ "delivery.methods": "Pickup", status: "active" })
      .select("_id")
      .lean();
    filter.store = { $in: stores.map((s) => s._id) };
  }

  if (query.delivery === "free") {
    const stores = await Store.find({ "delivery.fee": 0, status: "active" }).select("_id").lean();
    filter.store = { $in: stores.map((s) => s._id) };
  }

  return filter;
};

const list = async (req, res) => {
  const filter = await buildFilter(req.query);
  const sort = SORTS[req.query.sort] || SORTS.recommended;
  const { page, limit, skip } = getPagination(req.query, 48);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("store", "name slug logo rating verification location")
      .populate("category", "name slug icon accent")
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginated(items, total, { page, limit }) });
};

const facets = async (req, res) => {
  const filter = await buildFilter(req.query);
  const [storeIds, categoryIds] = await Promise.all([
    Product.distinct("store", filter),
    Product.distinct("category", filter),
  ]);

  const [stores, categories, priceRange] = await Promise.all([
    Store.find({ _id: { $in: storeIds }, status: "active" })
      .select("name slug logo rating verification delivery")
      .sort({ "rating.average": -1 })
      .lean(),
    Category.find({ _id: { $in: categoryIds } })
      .select("name slug icon accent image productCount order")
      .sort({ order: 1 })
      .lean(),
    Product.aggregate([
      { $match: filter },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      stores,
      categories,
      priceRange: {
        min: Math.floor(priceRange[0]?.min ?? 0),
        max: Math.ceil(priceRange[0]?.max ?? 500),
      },
    },
  });
};

const getById = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("store", "name slug logo cover rating verification location delivery policies hours promo")
    .populate("category", "name slug icon accent")
    .lean();

  if (!product || product.status === "archived") {
    throw ApiError.notFound("That product is no longer available");
  }

  // Guard the populated refs: a product saved with a stale category id should
  // still render, just without related suggestions.
  const refs = [
    product.category ? { category: product.category._id } : null,
    product.store ? { store: product.store._id } : null,
  ].filter(Boolean);

  const related = refs.length
    ? await Product.find({
        _id: { $ne: product._id },
        status: "active",
        $or: refs,
      })
        .sort({ "rating.average": -1, soldCount: -1 })
        .limit(8)
        .select(PRODUCT_FIELDS)
        .populate("store", "name slug logo rating")
        .populate("category", "name slug icon accent")
        .lean()
    : [];

  res.json({ success: true, data: { product, related } });
};

const create = async (req, res) => {
  const store = req.store || (await Store.findOne({ owner: req.user._id }));
  if (!store) throw ApiError.forbidden("You need an approved store to list products");

  const product = await Product.create({
    name: req.body.name,
    description: req.body.description || "",
    details: req.body.details || req.body.description || "",
    price: Number(req.body.price),
    compareAtPrice: Number(req.body.compareAtPrice) || 0,
    images: req.body.images || [],
    store: store._id,
    category: req.body.category,
    stock: Number(req.body.stock) || 0,
    sku: req.body.sku || "",
    tags: req.body.tags || [],
    specs: req.body.specs || [],
    status: req.body.status || "active",
    unit: req.body.unit || "each",
    deal: req.body.deal || { isDeal: false, badge: "" },
  });

  await Store.updateOne({ _id: store._id }, { $inc: { "stats.products": 1 } });
  res.status(201).json({ success: true, data: { product } });
};

const update = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  const product = await Product.findOne({ _id: req.params.id, store: store ? store._id : null });
  if (!product) throw ApiError.notFound("Product not found in your store");

  const allowed = [
    "name", "description", "details", "price", "compareAtPrice", "images", "category",
    "stock", "sku", "tags", "specs", "status", "unit", "featured", "deal",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });
  if (req.body.price !== undefined) product.price = Number(req.body.price);
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
  if (req.body.compareAtPrice !== undefined) {
    product.compareAtPrice = Number(req.body.compareAtPrice) || 0;
  }
  if (req.body.deal !== undefined && product.compareAtPrice > product.price) {
    product.deal = { ...product.deal, isDeal: true };
  }

  await product.save();
  res.json({ success: true, data: { product } });
};

const remove = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  const product = await Product.findOne({ _id: req.params.id, store: store ? store._id : null });
  if (!product) throw ApiError.notFound("Product not found in your store");

  await product.deleteOne();
  await Store.updateOne({ _id: product.store }, { $inc: { "stats.products": -1 } });
  res.json({ success: true, message: "Product deleted" });
};

const mine = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw ApiError.forbidden("You do not have a store yet");

  const { page, limit, skip } = getPagination(req.query, 50);
  const filter = { store: store._id };
  if (req.query.q) filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = await resolveCategory(req.query.category);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug icon accent")
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: { ...paginated(items, total, { page, limit }), store } });
};

module.exports = { list, getById, create, update, remove, mine, facets, resolveCategory, resolveStore };
