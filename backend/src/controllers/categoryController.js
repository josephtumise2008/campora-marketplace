const Category = require("../models/Category");
const Product = require("../models/Product");
const Store = require("../models/Store");
const ApiError = require("../utils/ApiError");

const list = async (_req, res) => {
  const categories = await Category.find({ status: "active" }).sort({ order: 1, name: 1 }).lean();
  res.json({ success: true, data: { items: categories } });
};

const getBySlug = async (req, res) => {
  const category = await Category.findOne({ slug: String(req.params.slug).toLowerCase() }).lean();
  if (!category) throw ApiError.notFound("That category does not exist");

  const [storeCount, productCount] = await Promise.all([
    Store.countDocuments({ categories: category._id, status: "active" }),
    Product.countDocuments({ category: category._id, status: "active" }),
  ]);

  res.json({
    success: true,
    data: {
      category,
      stats: { stores: storeCount, products: productCount },
    },
  });
};

const create = async (req, res) => {
  const category = await Category.create({
    name: req.body.name,
    slug:
      req.body.slug ||
      String(req.body.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    tagline: req.body.tagline || "",
    description: req.body.description || "",
    image: req.body.image || "",
    icon: req.body.icon || "Package",
    accent: req.body.accent || "#1A73E8",
    order: Number(req.body.order) || 0,
    featured: Boolean(req.body.featured),
    status: req.body.status || "active",
  });
  res.status(201).json({ success: true, data: { category } });
};

const update = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");
  const allowed = [
    "name", "slug", "tagline", "description", "image", "icon", "accent", "order", "featured", "status",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });
  await category.save();
  res.json({ success: true, data: { category } });
};

const remove = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw ApiError.conflict(
      `Move or archive the ${productCount} products in this category before removing it`
    );
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category removed" });
};

const recount = async (req, res) => {
  const categories = await Category.find().lean();
  await Promise.all(
    categories.map((category) =>
      Product.countDocuments({ category: category._id, status: "active" }).then((count) =>
        Category.updateOne({ _id: category._id }, { $set: { productCount: count } })
      )
    )
  );
  res.json({ success: true, message: "Category product counts refreshed" });
};

module.exports = { list, getBySlug, create, update, remove, recount };
