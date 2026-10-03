const Address = require("../models/Address");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const listAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
  res.json({ success: true, data: { items: addresses } });
};

const createAddress = async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user._id });
  if (address.isDefault) {
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
  }
  res.status(201).json({ success: true, data: { address } });
};

const updateAddress = async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound("Address not found");

  const allowed = ["label", "recipient", "line1", "line2", "city", "state", "zip", "phone", "instructions", "type", "isDefault"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) address[field] = req.body[field];
  });
  await address.save();

  if (address.isDefault) {
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
  }
  res.json({ success: true, data: { address } });
};

const removeAddress = async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound("Address not found");
  res.json({ success: true, message: "Address removed" });
};

const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "wishlist",
          match: { status: "active" },
      populate: [
        { path: "store", select: "name slug logo rating verification" },
        { path: "category", select: "name slug icon accent" },
      ],
    })
    .lean();

  res.json({
    success: true,
    data: {
      items: user.wishlist,
      stores: await Store.find({ _id: { $in: user.favoriteStores } })
        .select("name slug logo cover rating verification")
        .lean(),
    },
  });
};

const toggleWishlist = async (req, res) => {
  const product = await Product.findById(req.params.id).select("name status");
  if (!product) throw ApiError.notFound("Product not found");

  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex((entry) => entry.toString() === product._id.toString());
  let added;
  if (index >= 0) {
    user.wishlist.splice(index, 1);
    added = false;
  } else {
    user.wishlist.unshift(product._id);
    added = true;
  }
  user.wishlist = user.wishlist.slice(0, 60);
  await user.save();

  res.json({
    success: true,
    data: { added, name: product.name, count: user.wishlist.length },
  });
};

const toggleFavoriteStore = async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw ApiError.notFound("Store not found");
  const user = await User.findById(req.user._id);
  const index = user.favoriteStores.findIndex((entry) => entry.toString() === store._id.toString());
  if (index >= 0) user.favoriteStores.splice(index, 1);
  else user.favoriteStores.push(store._id);
  await user.save();
  res.json({ success: true, data: { following: index < 0 } });
};

const getFavorites = async (req, res) => {
  const stores = await Store.find({ _id: { $in: req.user.favoriteStores } })
    .select("name slug logo cover rating verification delivery location")
    .lean();
  res.json({ success: true, data: { items: stores } });
};

const pushRecentSearch = async (req, res) => {
  const term = String(req.body.term || "").trim();
  if (!term) return res.json({ success: true, data: { recentSearches: req.user.recentSearches } });

  const user = await User.findById(req.user._id);
  user.recentSearches = [term, ...user.recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
  await user.save();
  return res.json({ success: true, data: { recentSearches: user.recentSearches } });
};

const clearRecentSearches = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.recentSearches = [];
  await user.save();
  res.json({ success: true, data: { recentSearches: [] } });
};

const getNotifications = async (req, res) => {
  const Notification = require("../models/Notification");
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, data: { items: notifications, unread } });
};

const markNotificationsRead = async (req, res) => {
  const Notification = require("../models/Notification");
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ success: true, message: "Notifications marked as read" });
};

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  removeAddress,
  getWishlist,
  toggleWishlist,
  toggleFavoriteStore,
  getFavorites,
  pushRecentSearch,
  clearRecentSearches,
  getNotifications,
  markNotificationsRead,
};
