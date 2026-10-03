const User = require("../models/User");
const Store = require("../models/Store");
const Address = require("../models/Address");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const tokenService = require("../services/tokenService");
const { AVATARS } = require("../data/seedData");
const { findUniversity } = require("../data/universities");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  bio: user.bio,
  university: user.university,
  store: user.store || null,
  addresses: user.addresses || [],
  wishlist: user.wishlist || [],
  favoriteStores: user.favoriteStores || [],
  recentSearches: user.recentSearches || [],
  notificationPrefs: user.notificationPrefs,
  paymentPrefs: user.paymentPrefs,
  createdAt: user.createdAt,
});

const register = async (req, res) => {
  const { name, email, password, role, university, phone, storeApplication } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw ApiError.conflict("An account with that email already exists");

  const wantsSeller = role === "seller";
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || "",
    role: wantsSeller ? "customer" : role || "customer",
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    university: university
      ? { code: university, name: findUniversity(university)?.name || "" }
      : { code: "", name: "" },
  });

  if (wantsSeller && storeApplication?.businessName) {
    const Category = require("../models/Category");
    const primary = await Category.findOne({ slug: storeApplication.category || "services" });
    const store = await Store.create({
      name: storeApplication.businessName,
      slug: `${storeApplication.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`,
      tagline: storeApplication.tagline || "",
      description: storeApplication.description || "",
      logo: storeApplication.logo || "",
      cover: storeApplication.cover || "",
      category: primary?._id,
      categories: primary ? [primary._id] : [],
      owner: user._id,
      verification: "pending",
      status: "active",
      location: {
        city: storeApplication.city || "",
        state: storeApplication.state || "",
        address: storeApplication.address || "",
        zip: storeApplication.zip || "",
        universities: [storeApplication.university].filter(Boolean),
      },
      contact: { email: user.email, phone: storeApplication.phone || user.phone || "" },
      delivery: {
        fee: 2.99,
        freeThreshold: 35,
        etaMinutes: Number(storeApplication.etaMinutes) || 40,
        methods: storeApplication.deliveryMethods?.length
          ? storeApplication.deliveryMethods
          : ["Delivery", "Pickup"],
      },
    });
    user.role = "seller";
    user.store = store._id;
    await user.save();
  }

  await Address.create({
    user: user._id,
    label: "Dorm",
    recipient: user.name,
    line1: "100 Campus Way",
    city: findUniversity(user.university?.code)?.city || "Campus",
    state: findUniversity(user.university?.code)?.state || "Campus",
    zip: "90000",
    phone: user.phone,
    type: "dorm",
    isDefault: true,
  });

  await Notification.create({
    user: user._id,
    type: "system",
    title: `Welcome to Campora, ${user.name.split(" ")[0]}`,
    body: user.role === "seller"
      ? "Your store application is under review. We will notify you as soon as it is approved."
      : "Pick your campus, browse nearby stores, and add something to your cart.",
    link: user.role === "seller" ? "/seller" : "/explore",
  });

  const token = tokenService.sign(user);
  res.status(201).json({ success: true, data: { user: publicUser(user), token } });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("That email and password combination did not match");
  }
  if (!user.isActive) throw ApiError.forbidden("This account has been disabled");

  user.lastLoginAt = new Date();
  await user.save();

  const token = tokenService.sign(user);
  res.json({ success: true, data: { user: publicUser(user), token } });
};

const me = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("store", "name slug logo verification rating")
    .populate("wishlist", "name price images rating stock store category")
    .populate("favoriteStores", "name slug logo cover rating verification")
    .lean();

  if (!user) throw ApiError.notFound("Account not found");

  const store = user.store
    ? {
        id: user.store._id,
        name: user.store.name,
        slug: user.store.slug,
        logo: user.store.logo,
        verification: user.store.verification,
        rating: user.store.rating,
      }
    : null;

  res.json({ success: true, data: { user: { ...publicUser(user), store } } });
};

const updateProfile = async (req, res) => {
  const allowed = ["name", "phone", "avatar", "bio", "notificationPrefs", "paymentPrefs"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  if (req.body.university) {
    const code = String(req.body.university);
    req.user.university = { code, name: findUniversity(code)?.name || "" };
  }

  await req.user.save();
  res.json({ success: true, data: { user: publicUser(req.user) } });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw ApiError.badRequest("New password must be at least 8 characters");
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword || ""))) {
    throw ApiError.badRequest("Your current password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
};

/**
 * Local demo implementation: no external mail provider, so we return a
 * neutral response and record the request on the user's notifications.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (user) {
    await Notification.create({
      user: user._id,
      type: "account",
      title: "Password reset requested",
      body:
        "A reset was requested for your Campora account. In this local build, no email is sent — set a new password from your account settings.",
      link: "/account/settings",
    });
  }
  res.json({
    success: true,
    message:
      "If an account exists for that email, a reset notice has been queued. This local build does not send email.",
  });
};

module.exports = { register, login, me, updateProfile, changePassword, forgotPassword, publicUser };
