"use strict";

/**
 * Demo marketplace seed data.
 *
 * Used by the standalone `npm run seed` command against MongoDB, and called
 * automatically on boot when Campora falls back to the in-memory database.
 */

const env = require("../config/env");
const { universityCity } = require("./universities");

const User = require("../models/User");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Address = require("../models/Address");
const Notification = require("../models/Notification");

const {
  CATEGORIES,
  STORES,
  PRODUCTS,
  REVIEW_TEMPLATES,
  REVIEW_TITLES,
  CUSTOMERS,
  SELLER_OWNERS,
  ADMIN,
  DEMO_PASSWORD,
  AVATARS,
  STORE_ASSETS,
  HERO_IMAGES,
} = require("./seedData");

const round2 = (n) => Math.round(n * 100) / 100;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Deterministic pseudo-random generator so re-seeding produces the same
 * demo marketplace every time.
 */
const makeRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const STATUS_FLOW = [
  "Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered",
];

const STATUS_LABELS = {
  Pending: "Order placed",
  Confirmed: "Seller confirmed",
  Preparing: "Being prepared",
  Ready: "Ready for pickup or delivery",
  "Out for Delivery": "Out for delivery",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

/**
 * Seed the database. Pass `{ quiet: true }` to suppress the console summary
 * (used when seeding automatically at boot).
 */
const seedDatabase = async ({ quiet = false } = {}) => {
  const log = quiet ? () => {} : console.log;

  log("Clearing Campora collections…");

  await Promise.all([
    User.deleteMany({}),
    Store.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Address.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  /* ---------------- Categories ---------------- */
  const categoryDocs = await Category.insertMany(
    CATEGORIES.map((category) => ({ ...category, status: "active" }))
  );
  const categoryBySlug = new Map(categoryDocs.map((c) => [c.slug, c]));
  log(`Inserted ${categoryDocs.length} categories`);

  /* ---------------- Users ---------------- */
  // `create` (not `insertMany`) so the password-hashing hook runs.
  const sellerDocs = [];
  for (const owner of SELLER_OWNERS) {
    sellerDocs.push(
      await User.create({
        name: owner.name,
        email: owner.email,
        password: DEMO_PASSWORD,
        role: "seller",
        avatar: AVATARS[owner.avatarIndex],
        university: { code: "", name: "" },
      })
    );
  }
  const sellerByEmail = new Map(sellerDocs.map((u) => [u.email, u]));

  const customerDocs = [];
  for (const customer of CUSTOMERS) {
    customerDocs.push(
      await User.create({
        name: customer.name,
        email: customer.email,
        password: DEMO_PASSWORD,
        role: "customer",
        avatar: AVATARS[customer.avatarIndex],
        phone: customer.phone,
        bio: customer.bio,
        university: { code: customer.university.code, name: customer.university.name },
      })
    );
  }

  const adminDoc = await User.create({
    name: ADMIN.name,
    email: ADMIN.email,
    password: DEMO_PASSWORD,
    role: "admin",
    avatar: AVATARS[ADMIN.avatarIndex],
    bio: ADMIN.bio,
    university: { code: ADMIN.university.code, name: ADMIN.university.name },
  });
  log(`Inserted ${customerDocs.length} customers, ${sellerDocs.length} sellers, 1 admin`);

  /* ---------------- Addresses ---------------- */
  await Address.insertMany(
    customerDocs.map((customer, index) => {
      const profile = CUSTOMERS[index];
      const place = universityCity(profile.university.code);
      return {
        user: customer._id,
        label: index % 3 === 0 ? "Dorm" : index % 3 === 1 ? "Apartment" : "Home",
        recipient: customer.name,
        line1: `${100 + index * 14} University Avenue`,
        line2: index % 2 === 0 ? `Building ${String.fromCharCode(65 + index)}, Apt ${index + 2}` : "",
        city: place.city,
        state: place.state,
        zip: place.zip,
        phone: profile.phone,
        type: index % 3 === 0 ? "dorm" : index % 3 === 1 ? "apartment" : "home",
        isDefault: true,
        instructions: index % 4 === 0 ? "Buzzer is broken — text on arrival." : "",
      };
    })
  );

  /* ---------------- Stores ---------------- */
  const storeDocs = [];
  for (const store of STORES) {
    const owner = sellerByEmail.get(
      SELLER_OWNERS.find((entry) => entry.store === store.slug).email
    );
    const assets = STORE_ASSETS[store.slug] || { logo: "", cover: "" };

    const doc = await Store.create({
      name: store.name,
      slug: store.slug,
      tagline: store.tagline,
      description: store.description,
      logo: store.logo || assets.logo,
      cover: store.cover || assets.cover,
      category: categoryBySlug.get(store.category)._id,
      categories: (store.categories || [store.category]).map((slug) => categoryBySlug.get(slug)._id),
      owner: owner._id,
      verification: store.verification,
      status: store.status || "active",
      featured: Boolean(store.featured),
      rating: store.rating,
      location: store.location,
      delivery: store.delivery,
      contact: store.contact,
      hours: store.hours,
      policies: store.policies,
      promo: store.promo,
    });

    owner.store = doc._id;
    await owner.save();
    storeDocs.push(doc);
  }
  const storeBySlug = new Map(storeDocs.map((s) => [s.slug, s]));
  log(`Inserted ${storeDocs.length} stores`);

  /* ---------------- Products ---------------- */
  const productDocs = await Product.insertMany(
    PRODUCTS.map((entry) => {
      const store = storeBySlug.get(entry.storeSlug);
      const category = categoryBySlug.get(entry.categorySlug);
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 3600 * 1000);
      return {
        name: entry.name,
        slug: entry.slug,
        description: entry.description,
        details: entry.details,
        price: entry.price,
        compareAtPrice: entry.compareAtPrice,
        images: entry.images,
        store: store._id,
        category: category._id,
        rating: entry.rating,
        stock: entry.stock,
        sku: entry.sku,
        tags: entry.tags,
        specs: entry.specs,
        status: entry.status,
        unit: entry.unit,
        deal: entry.deal,
        featured: entry.featured,
        soldCount: entry.soldCount,
        createdAt,
        updatedAt: createdAt,
      };
    })
  );
  const categoryCounts = new Map();
  productDocs.forEach((product) => {
    const key = product.category.toString();
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  });
  await Promise.all(
    categoryDocs.map((category) =>
      Category.updateOne(
        { _id: category._id },
        { $set: { productCount: categoryCounts.get(category._id.toString()) || 0 } }
      )
    )
  );
  log(`Inserted ${productDocs.length} products`);

  /* ---------------- Reviews ---------------- */
  const random = makeRandom(20260925);
  const reviewRows = [];

  productDocs.forEach((product) => {
    const target = Math.min(4, Math.max(0, Math.round(product.rating.count / 220)));
    for (let i = 0; i < target; i += 1) {
      const author = customerDocs[Math.floor(random() * customerDocs.length)];
      const roll = random();
      const stars = roll > 0.78 ? 5 : roll > 0.32 ? 4 : roll > 0.12 ? 3 : roll > 0.04 ? 2 : 5;
      const templates = REVIEW_TEMPLATES[stars];
      const titles = REVIEW_TITLES[stars];
      reviewRows.push({
        product: product._id,
        store: product.store,
        user: author._id,
        rating: stars,
        title: pick(titles),
        comment: pick(templates),
        verifiedPurchase: random() > 0.25,
        createdAt: new Date(Date.now() - Math.floor(random() * 70) * 24 * 3600 * 1000),
      });
    }
  });

  // De-duplicate on (product, user) — the model enforces a unique index.
  const seen = new Set();
  const uniqueReviews = reviewRows.filter((row) => {
    const key = `${row.product}-${row.user}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await Review.insertMany(uniqueReviews);
  log(`Inserted ${uniqueReviews.length} reviews`);

  // Live averages come from the reviews that exist, blended with the seeded
  // baseline so store ratings still read like an established marketplace.
  const productReviewAgg = await Review.aggregate([
    { $match: { status: "published" } },
    { $group: { _id: "$product", count: { $sum: 1 }, weighted: { $sum: "$rating" } } },
  ]);
  const productAggMap = new Map(productReviewAgg.map((row) => [row._id.toString(), row]));
  await Promise.all(
    productDocs.map(async (product) => {
      const stats = productAggMap.get(product._id.toString());
      if (!stats) return;
      const average = round2((stats.weighted / stats.count) * 0.4 + product.rating.average * 0.6);
      await Product.updateOne(
        { _id: product._id },
        { $set: { "rating.average": average, "rating.count": product.rating.count } }
      );
      product.rating.average = average;
    })
  );

  const storeReviewAgg = await Review.aggregate([
    { $match: { status: "published" } },
    { $group: { _id: "$store", count: { $sum: 1 }, weighted: { $sum: "$rating" } } },
  ]);
  const storeAggMap = new Map(storeReviewAgg.map((row) => [row._id.toString(), row]));
  await Promise.all(
    storeDocs.map(async (store) => {
      const stats = storeAggMap.get(store._id.toString());
      const baseline = STORES.find((s) => s.slug === store.slug)?.rating;
      const average = stats
        ? round2(stats.weighted / stats.count * 0.35 + (baseline?.average || 4.5) * 0.65)
        : baseline?.average || 0;
      const count = Math.round((stats?.count || 0) * 40 + (baseline?.count || 0) * 0.6);
      await Store.updateOne(
        { _id: store._id },
        { $set: { "rating.average": average, "rating.count": count } }
      );
    })
  );

  /* ---------------- Orders ---------------- */
  const activeStores = storeDocs.filter((s) => s.status === "active" && s.verification === "verified");
  const orderDocs = [];
  const orderPlan = [
    { daysAgo: 1, status: "Out for Delivery", items: 3 },
    { daysAgo: 1, status: "Preparing", items: 2 },
    { daysAgo: 2, status: "Confirmed", items: 2 },
    { daysAgo: 3, status: "Delivered", items: 4 },
    { daysAgo: 3, status: "Delivered", items: 2 },
    { daysAgo: 4, status: "Delivered", items: 1 },
    { daysAgo: 5, status: "Delivered", items: 3 },
    { daysAgo: 6, status: "Delivered", items: 2 },
    { daysAgo: 7, status: "Delivered", items: 5 },
    { daysAgo: 8, status: "Delivered", items: 2 },
    { daysAgo: 9, status: "Delivered", items: 3 },
    { daysAgo: 11, status: "Delivered", items: 1 },
    { daysAgo: 12, status: "Delivered", items: 4 },
    { daysAgo: 14, status: "Delivered", items: 2 },
    { daysAgo: 15, status: "Delivered", items: 3 },
    { daysAgo: 17, status: "Delivered", items: 2 },
    { daysAgo: 19, status: "Delivered", items: 1 },
    { daysAgo: 21, status: "Delivered", items: 4 },
    { daysAgo: 23, status: "Delivered", items: 2 },
    { daysAgo: 25, status: "Delivered", items: 3 },
    { daysAgo: 27, status: "Cancelled", items: 2 },
    { daysAgo: 28, status: "Delivered", items: 1 },
    { daysAgo: 30, status: "Delivered", items: 3 },
    { daysAgo: 33, status: "Delivered", items: 2 },
    { daysAgo: 36, status: "Delivered", items: 1 },
    { daysAgo: 39, status: "Delivered", items: 3 },
    { daysAgo: 42, status: "Delivered", items: 2 },
    { daysAgo: 45, status: "Delivered", items: 4 },
    { daysAgo: 48, status: "Delivered", items: 2 },
    { daysAgo: 52, status: "Delivered", items: 1 },
    { daysAgo: 56, status: "Delivered", items: 2 },
  ];

  const activeStoreIds = new Set(
    storeDocs.filter((s) => s.status === "active").map((s) => s._id.toString())
  );
  const campusProducts = productDocs.filter((p) => activeStoreIds.has(p.store.toString()));

  orderPlan.forEach((plan, index) => {
    const customer = customerDocs[index % customerDocs.length];
    const place = universityCity(customer.university.code);
    const pool = campusProducts.filter((p) => {
      const store = storeDocs.find((s) => s._id.toString() === p.store.toString());
      return store.location.universities.includes(customer.university.code);
    });
    const available = pool.length >= plan.items ? pool : campusProducts;
    const chosen = shuffle(available).slice(0, plan.items);

    const storeIds = [...new Set(chosen.map((p) => p.store.toString()))];
    const items = chosen.map((product) => {
      const quantity = 1 + Math.floor(random() * 2);
      return {
        product: product._id,
        store: product.store,
        storeName: storeDocs.find((s) => s._id.toString() === product.store.toString())?.name || "",
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity,
        lineTotal: round2(product.price * quantity),
        status: plan.status,
      };
    });

    const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const deliveryFee =
      storeIds.length > 1 ? round2(storeIds.length * 1.5) : random() > 0.5 ? 0 : 1.99;
    const discount = random() > 0.78 ? round2(subtotal * 0.1) : 0;
    const tax = round2((subtotal - discount) * env.taxRate);
    const serviceFee = round2(subtotal * env.serviceFeeRate);
    const total = round2(subtotal - discount + tax + serviceFee + deliveryFee);

    const placedAt = new Date(Date.now() - plan.daysAgo * 24 * 3600 * 1000 - Math.floor(random() * 10) * 3600 * 1000);
    const finalIndex = plan.status === "Cancelled" ? 0 : STATUS_FLOW.indexOf(plan.status);
    const timeline = STATUS_FLOW.slice(0, finalIndex + 1).map((status, stepIndex) => ({
      status,
      label: STATUS_LABELS[status],
      note:
        stepIndex === 0
          ? "Payment authorised in demo mode"
          : `Updated by ${items[0]?.storeName || "the seller"}`,
      at: new Date(placedAt.getTime() + stepIndex * 22 * 60 * 1000),
    }));

    orderDocs.push({
      orderNumber: `CMP-${placedAt.getTime().toString(36).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
      customer: customer._id,
      items,
      status: plan.status,
      totals: { subtotal, deliveryFee, serviceFee, tax, discount, total },
      deliveryAddress: {
        recipient: customer.name,
        line1: `${100 + (index % 7) * 14} University Avenue`,
        line2: index % 2 === 0 ? `Building ${String.fromCharCode(65 + (index % 6))}, Apt ${(index % 9) + 2}` : "",
        city: place.city,
        state: place.state,
        zip: place.zip,
        phone: customer.phone,
        instructions: "",
      },
      deliveryMethod: random() > 0.7 ? "Pickup" : "Delivery",
      payment: {
        method: "Demo Card",
        status: plan.status === "Cancelled" ? "refunded" : "paid",
        brand: random() > 0.5 ? "Visa" : "Mastercard",
        last4: String(1000 + Math.floor(random() * 8999)),
        simulated: true,
        reference: `demo_seed_${index}`,
      },
      customerNote: index % 5 === 0 ? "Please leave at the front desk." : "",
      timeline,
      placedAt,
      deliveredAt: plan.status === "Delivered" ? new Date(placedAt.getTime() + 90 * 60 * 1000) : undefined,
      createdAt: placedAt,
      updatedAt: placedAt,
    });
  });

  await Order.insertMany(orderDocs);

  // Store-level aggregates so the seller dashboard and admin reports have
  // meaningful numbers immediately.
  const storeAgg = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.store",
        orders: { $addToSet: "$_id" },
        revenue: { $sum: "$items.lineTotal" },
        units: { $sum: "$items.quantity" },
      },
    },
  ]);
  await Promise.all(
    storeAgg.map((row) =>
      Store.updateOne(
        { _id: row._id },
        {
          $set: {
            "stats.orders": row.orders.length,
            "stats.revenue": round2(row.revenue),
            "stats.unitsSold": row.units,
          },
        }
      )
    )
  );
  log(`Inserted ${orderDocs.length} orders`);

  /* ---------------- Notifications ---------------- */
  await Notification.insertMany([
    {
      user: adminDoc._id,
      type: "system",
      title: "Store application to review",
      body: "Sunset Snack Bar submitted a store application for Campora verification.",
      link: "/admin/stores",
    },
    {
      user: customerDocs[0]._id,
      type: "deal",
      title: "Free delivery this week",
      body: "Campus Grocery Co. is offering free delivery on orders over $35 near your campus.",
      link: "/category/groceries",
    },
  ]);


  /* ---------------- Summary ---------------- */
  const counts = {
    users: await User.countDocuments(),
    stores: await Store.countDocuments(),
    products: await Product.countDocuments(),
    categories: await Category.countDocuments(),
    orders: await Order.countDocuments(),
    reviews: await Review.countDocuments(),
    addresses: await Address.countDocuments(),
    notifications: await Notification.countDocuments(),
  };

  if (!quiet) {
    log("\nCampora demo marketplace is ready.\n");
    log("  Users        ", counts.users);
    log("  Stores       ", counts.stores);
    log("  Products     ", counts.products);
    log("  Categories   ", counts.categories);
    log("  Orders       ", counts.orders);
    log("  Reviews      ", counts.reviews);
    log("  Addresses    ", counts.addresses);
    log("\nDemo sign-ins (password for all: %s)", DEMO_PASSWORD);
    log("  Customer   %s", CUSTOMERS[0].email);
    log("  Seller     %s (Campus Grocery Co.)", SELLER_OWNERS[0].email);
    log("  Seller     %s (ByteTech)", SELLER_OWNERS[2].email);
    log("  Admin      %s", ADMIN.email);
    log("\nHero imagery available at: %s", HERO_IMAGES.shopping);
  }

  return counts;
};

module.exports = { seedDatabase, DEMO_PASSWORD, STATUS_FLOW, STATUS_LABELS };
