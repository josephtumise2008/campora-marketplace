const Review = require("../models/Review");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { getPagination, paginated } = require("../utils/pagination");

const recalculate = async (productId, storeId) => {
  const rows = await Review.aggregate([
    { $match: { status: "published", ...(productId ? { product: productId } : { store: storeId }) } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const weighted = rows.reduce((sum, r) => sum + r._id * r.count, 0);
  const average = total ? Math.round((weighted / total) * 10) / 10 : 0;

  if (productId) await Product.updateOne({ _id: productId }, { $set: { "rating.average": average, "rating.count": total } });
  if (storeId) await Store.updateOne({ _id: storeId }, { $set: { "rating.average": average, "rating.count": total } });
  return { average, count: total };
};

const forProduct = async (req, res) => {
  const product = await Product.findById(req.params.productId).select("name rating");
  if (!product) throw ApiError.notFound("Product not found");

  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { product: product._id, status: "published" };

  const [items, total, buckets] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name avatar")
      .populate("store", "name slug")
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  let userReview = null;
  if (req.user) {
    userReview = await Review.findOne({ product: product._id, user: req.user._id }).lean();
  }

  res.json({
    success: true,
    data: {
      product: { _id: product._id, name: product.name, rating: product.rating },
      reviews: paginated(items, total, { page, limit }),
      ratingBuckets: buckets,
      userReview,
    },
  });
};

const forStore = async (req, res) => {
  const store = await Store.findById(req.params.storeId).select("name rating");
  if (!store) throw ApiError.notFound("Store not found");

  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { store: store._id, status: "published" };

  const [items, total, buckets] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name avatar")
      .populate("product", "name images")
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      store: { _id: store._id, name: store.name, rating: store.rating },
      reviews: paginated(items, total, { page, limit }),
      ratingBuckets: buckets,
    },
  });
};

const create = async (req, res) => {
  const { productId, rating, title, comment } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");

  if (product.store.toString() === req.user._id.toString()) {
    throw ApiError.forbidden("You cannot review your own product");
  }

  const existing = await Review.findOne({ product: product._id, user: req.user._id });
  if (existing) {
    throw ApiError.conflict("You have already reviewed this product — edit your existing review instead");
  }

  const user = await User.findById(req.user._id);
  const order = await require("../models/Order").findOne({
    customer: req.user._id,
    "items.product": product._id,
    status: { $ne: "Cancelled" },
  });

  const review = await Review.create({
    product: product._id,
    store: product.store,
    user: req.user._id,
    rating: Number(rating),
    title: title || "",
    comment: comment || "",
    verifiedPurchase: Boolean(order),
  });

  const productRating = await recalculate(product._id, null);
  await recalculate(null, product.store);

  res.status(201).json({
    success: true,
    data: { review, rating: productRating, reviewer: { name: user.name, avatar: user.avatar } },
  });
};

const update = async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound("Review not found");

  if (req.body.rating !== undefined) review.rating = Number(req.body.rating);
  if (req.body.title !== undefined) review.title = req.body.title;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();

  const rating = await recalculate(review.product, null);
  await recalculate(null, review.store);
  res.json({ success: true, data: { review, rating } });
};

const remove = async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound("Review not found");

  const { product, store } = review;
  await review.deleteOne();
  await recalculate(product, null);
  await recalculate(null, store);
  res.json({ success: true, message: "Review removed" });
};

const mine = async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("product", "name images")
    .populate("store", "name slug logo")
    .lean();
  res.json({ success: true, data: { items: reviews } });
};

module.exports = { forProduct, forStore, create, update, remove, mine, recalculate };
