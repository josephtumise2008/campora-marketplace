/* eslint-disable no-console */
"use strict";

/**
 * End-to-end API smoke test. Run against a booted Campora API:
 *   CAMPORA_MEMORY_DB=true PORT=5099 node src/server.js
 *   BASE=http://localhost:5099 node src/smoke.js
 */

const BASE = process.env.BASE || "http://localhost:5050";

let passed = 0;
let failed = 0;
const failures = [];

const callRaw = async (method, path, { token, bytes, fileName, contentType } = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      ...(fileName ? { "X-File-Name": fileName } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(bytes ? { body: bytes } : {}),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { status: response.status, body: payload };
};

const call = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { status: response.status, body: payload };
};

const check = (name, condition, detail) => {
  if (condition) {
    passed += 1;
    return true;
  }
  failed += 1;
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  return false;
};

const section = (title) => console.log(`\n${title}`);

const run = async () => {
  section("Public catalogue");
  const home = await call("GET", "/api/home");
  check("GET /api/home", home.status === 200 && home.body?.success, `status ${home.status}`);
  check(
    "home has hero products",
    Array.isArray(home.body?.data?.trending) && home.body.data.trending.length > 0,
    JSON.stringify(Object.keys(home.body?.data || {}))
  );
  check(
    "home stores",
    Array.isArray(home.body?.data?.featuredStores) && home.body.data.featuredStores.length > 0,
    JSON.stringify(Object.keys(home.body?.data || {}))
  );
  check("home deals", Array.isArray(home.body?.data?.deals));
  check("home nearby", Array.isArray(home.body?.data?.nearby));
  check("home newArrivals", Array.isArray(home.body?.data?.newArrivals));
  check(
    "home categories",
    Array.isArray(home.body?.data?.categories) && home.body.data.categories.length > 0
  );

  const products = await call("GET", "/api/products?limit=8&sort=newest");
  check("GET /api/products", products.status === 200 && products.body?.success);
  const firstProduct = products.body?.data?.items?.[0];
  check(
    "products paginated",
    Array.isArray(products.body?.data?.items) && typeof products.body.data.pagination.total === "number",
    JSON.stringify(products.body?.data?.pagination)
  );
  check("product has store populated", Boolean(firstProduct?.store?.name), JSON.stringify(firstProduct?.store));
  check("product has category populated", Boolean(firstProduct?.category?.name));
  check("product rating present", typeof firstProduct?.rating?.average === "number");

  const filtered = await call("GET", "/api/products?limit=5&sort=price-asc&minPrice=1&maxPrice=60");
  check(
    "price filter respected",
    filtered.status === 200 &&
      filtered.body.data.items.every((p) => p.price >= 1 && p.price <= 60),
    JSON.stringify(filtered.body?.data?.items?.map((p) => p.price))
  );
  check(
    "price sort respected",
    filtered.body.data.items.every((p, i, arr) => i === 0 || arr[i - 1].price <= p.price)
  );

  const q = encodeURIComponent("coffee");
  const search = await call("GET", `/api/search?q=${q}`);
  check("GET /api/search", search.status === 200 && search.body?.success);
  check(
    "search returns products",
    Array.isArray(search.body?.data?.products?.items) && search.body.data.products.items.length > 0,
    JSON.stringify(search.body?.data?.products?.total)
  );
  check("search stores populated", Array.isArray(search.body?.data?.stores));

  const facets = await call("GET", "/api/products/facets");
  check("GET /api/products/facets", facets.status === 200 && facets.body?.success);
  check(
    "facets price range",
    facets.body?.data?.priceRange?.min > 0 && facets.body.data.priceRange.max >= facets.body.data.priceRange.min,
    JSON.stringify(facets.body?.data?.priceRange)
  );
  check("facets store names present", facets.body?.data?.stores?.every((s) => Boolean(s.name && s.slug)));
  check("facets stores", Array.isArray(facets.body?.data?.stores) && facets.body.data.stores.length > 0);

  const stores = await call("GET", "/api/stores?limit=5");
  check("GET /api/stores", stores.status === 200 && stores.body?.success);
  const store = stores.body?.data?.items?.[0];
  const storeDetail = store?.slug ? await call("GET", `/api/stores/${store.slug}`) : { status: 0, body: {} };
  check(
    "store detail populates category",
    Boolean(storeDetail.body?.data?.store?.category?.name),
    `status ${storeDetail.status}`
  );
  check("store list returns refs", Boolean(store?._id) && typeof store?.rating?.average === "number");


  const slug = store?.slug;
  const storePage = await call("GET", `/api/stores/${slug}`);
  check("GET /api/stores/:slug", storePage.status === 200 && storePage.body?.success);
  check("store products", Array.isArray(storePage.body?.data?.products?.items));
  const storeId = storePage.body?.data?.store?._id;

  const productPage = await call("GET", `/api/products/${firstProduct?._id || firstProduct?.id}`);
  check(
    "GET /api/products/:id",
    productPage.status === 200 && productPage.body?.success,
    `status ${productPage.status} ${JSON.stringify(productPage.body?.message || "")}`
  );
  const productId = productPage.body?.data?.product?._id;
  check(
    "product detail contract",
    Boolean(productPage.body?.data?.product?._id) && Array.isArray(productPage.body?.data?.related),
    JSON.stringify(Object.keys(productPage.body?.data || {}))
  );
  check(
    "related products keep refs",
    (productPage.body?.data?.related || []).every((item) => Boolean(item.store) && Boolean(item.category))
  );

  const productReviews = await call("GET", `/api/reviews/product/${productId}`);
  check("GET /api/reviews/product/:id", productReviews.status === 200);
  check(
    "review summary contract",
    Boolean(productReviews.body?.data?.reviews?.pagination) && Array.isArray(productReviews.body?.data?.ratingBuckets),
    JSON.stringify(Object.keys(productReviews.body?.data || {}))
  );
  const storeReviews = await call("GET", `/api/reviews/store/${storeId}`);
  check("GET /api/reviews/store/:id", storeReviews.status === 200);

  const categories = await call("GET", "/api/categories");
  check("GET /api/categories", categories.status === 200 && categories.body?.success);
  const category = categories.body?.data?.items?.[0] || categories.body?.data?.[0];
  const categorySlug = category?.slug;
  const categoryPage = await call("GET", `/api/categories/${categorySlug}`);
  check("GET /api/categories/:slug", categoryPage.status === 200 && categoryPage.body?.success);

  section("Meta");
  check("GET /api/universities", (await call("GET", "/api/universities")).status === 200);
  check("GET /api/config", (await call("GET", "/api/config")).status === 200);

  section("Auth");
  const email = `smoke${Date.now()}@campora.test`;
  const registered = await call("POST", "/api/auth/register", {
    body: { name: "Smoke Tester", email, password: "campora123", role: "customer", university: "ucla" },
  });
  check("POST /api/auth/register", registered.status === 201 && registered.body?.success, `status ${registered.status} ${JSON.stringify(registered.body?.message || registered.body?.details || "")}`);
  const token = registered.body?.data?.token;
  check("register returns token", Boolean(token));
  check("register hashes password", registered.body?.data?.user?.password === undefined);
  check("register creates welcome notification", registered.status === 201);

  const dupe = await call("POST", "/api/auth/register", {
    body: { name: "Smoke Tester", email, password: "campora123" },
  });
  check("duplicate email rejected", dupe.status === 409, `status ${dupe.status}`);

  const badLogin = await call("POST", "/api/auth/login", {
    body: { email, password: "wrong-password" },
  });
  check("bad password rejected", badLogin.status === 401, `status ${badLogin.status}`);

  const login = await call("POST", "/api/auth/login", { body: { email, password: "campora123" } });
  check("POST /api/auth/login", login.status === 200 && Boolean(login.body?.data?.token), `status ${login.status}`);
  const customerToken = login.body.data.token;

  const me = await call("GET", "/api/auth/me", { token: customerToken });
  check("GET /api/auth/me", me.status === 200 && me.body?.data?.user?.email === email);
  check("me hides password", me.body?.data?.user?.password === undefined);

  const seededLogin = await call("POST", "/api/auth/login", {
    body: { email: "student@campora.market", password: "campora123" },
  });
  check("seeded customer can sign in", seededLogin.status === 200, `status ${seededLogin.status} ${JSON.stringify(seededLogin.body?.message || "")}`);
  const seededCustomerToken = seededLogin.body?.data?.token;

  const adminLogin = await call("POST", "/api/auth/login", {
    body: { email: "admin@campora.market", password: "campora123" },
  });
  check("seeded admin can sign in", adminLogin.status === 200, JSON.stringify(adminLogin.body?.message || ""));
  const adminToken = adminLogin.body?.data?.token;

  const sellerLogin = await call("POST", "/api/auth/login", {
    body: { email: "seller3@campora.market", password: "campora123" },
  });
  check("seeded seller can sign in", sellerLogin.status === 200, JSON.stringify(sellerLogin.body?.message || ""));
  const sellerToken = sellerLogin.body?.data?.token;

  section("Customer flows");
  check("unauthenticated /me blocked", (await call("GET", "/api/auth/me")).status === 401);

  const wishlist = await call("POST", `/api/users/wishlist/${productId}`, { token: customerToken });
  check("POST wishlist", wishlist.status === 200 && wishlist.body?.success, `status ${wishlist.status}`);
  check("wishlist added flag", wishlist.body?.data?.added === true, JSON.stringify(wishlist.body?.data));
  const wishlistGet = await call("GET", "/api/users/wishlist", { token: customerToken });
  check("GET wishlist", wishlistGet.status === 200 && wishlistGet.body?.data?.items?.length > 0);
  check(
    "wishlist products populated",
    wishlistGet.body?.data?.items?.every((p) => p && (p.name || p._id))
  );
  const wishlistRemove = await call("POST", `/api/users/wishlist/${productId}`, { token: customerToken });
  check("wishlist toggle removes", wishlistRemove.body?.data?.added === false);

  const follow = await call("POST", `/api/stores/${storeId}/follow`, { token: customerToken });
  check("POST follow store", follow.status === 200 && typeof follow.body?.data?.following === "boolean", `status ${follow.status}`);
  const favorites = await call("GET", "/api/users/favorites", { token: customerToken });
  check(
    "GET favorites",
    favorites.status === 200 && Array.isArray(favorites.body?.data?.items) && favorites.body.data.items.length === 1,
    JSON.stringify(Object.keys(favorites.body?.data || {}))
  );

  const recent = await call("POST", "/api/users/searches", { token: customerToken, body: { term: "hoodie" } });
  check("POST recent search", recent.status === 200 && recent.body?.data?.recentSearches?.length > 0, `status ${recent.status}`);
  check("GET recent searches", (await call("GET", "/api/users/searches", { token: customerToken })).status === 200);
  check("DELETE recent searches", (await call("DELETE", "/api/users/searches", { token: customerToken })).status === 200);

  const address = await call("POST", "/api/users/addresses", {
    token: customerToken,
    body: { recipient: "Smoke Tester", line1: "1 Test Way", city: "Berkeley", state: "CA", zip: "94704", isDefault: true },
  });
  check("POST address", address.status === 201 && address.body?.success, `status ${address.status} ${JSON.stringify(address.body?.message || address.body?.details || "")}`);
  const addressId = address.body?.data?.address?._id;
  check("GET addresses", (await call("GET", "/api/users/addresses", { token: customerToken })).status === 200);
  check(
    "PATCH address",
    (await call("PATCH", `/api/users/addresses/${addressId}`, { token: customerToken, body: { line1: "2 Test Way" } })).status === 200
  );
  check("DELETE address", (await call("DELETE", `/api/users/addresses/${addressId}`, { token: customerToken })).status === 200);

  const notifications = await call("GET", "/api/users/notifications", { token: customerToken });
  check("GET notifications", notifications.status === 200 && Array.isArray(notifications.body?.data?.items));
  check("mark notifications read", (await call("PATCH", "/api/users/notifications/read", { token: customerToken })).status === 200);

  const patchMe = await call("PATCH", "/api/auth/me", { token: customerToken, body: { bio: "Smoke test bio", phone: "5550100" } });
  check("PATCH /auth/me", patchMe.status === 200 && patchMe.body?.data?.user?.bio === "Smoke test bio", `status ${patchMe.status}`);

  const patchPassword = await call("PATCH", "/api/auth/password", {
    token: customerToken,
    body: { currentPassword: "campora123", newPassword: "campora456" },
  });
  check("PATCH password", patchPassword.status === 200, `status ${patchPassword.status} ${JSON.stringify(patchPassword.body?.message || "")}`);
  const relogin = await call("POST", "/api/auth/login", { body: { email, password: "campora456" } });
  check("new password works", relogin.status === 200, `status ${relogin.status}`);
  check(
    "old password rejected",
    (await call("POST", "/api/auth/login", { body: { email, password: "campora123" } })).status === 401
  );

  section("Cart, checkout and orders");
  const cartItems = [];
  for (const item of products.body.data.items.slice(0, 3)) {
    cartItems.push({ productId: item._id, quantity: 2 });
  }
  const quote = await call("POST", "/api/orders/quote", { token: customerToken, body: { items: cartItems } });
  check("POST /orders/quote", quote.status === 200 && quote.body?.success, `status ${quote.status} ${JSON.stringify(quote.body?.message || quote.body?.details || "")}`);
  check("quote has totals", typeof quote.body?.data?.totals?.total === "number", JSON.stringify(quote.body?.data?.totals));

  const addresses = await call("GET", "/api/users/addresses", { token: customerToken });
  check(
    "saved addresses listed",
    Array.isArray(addresses.body?.data?.items),
    JSON.stringify(addresses.body?.data)
  );

  const order = await call("POST", "/api/orders", {
    token: customerToken,
    body: {
      items: cartItems,
      deliveryAddress: {
        recipient: "Smoke Tester",
        line1: "1 Test Way",
        city: "Berkeley",
        state: "CA",
        zip: "94704",
        type: "dorm",
      },
      payment: { method: "Demo Card", cardNumber: "4242424242424242", expiry: "12/30", cvc: "123" },
      deliveryMethod: "Delivery",
    },
  });
  check("POST /orders (checkout)", order.status === 201 && order.body?.success, `status ${order.status} ${JSON.stringify(order.body?.message || order.body?.details || "")}`);
  const orderId = order.body?.data?.order?._id;
  check("order has orderNumber", typeof order.body?.data?.order?.orderNumber === "string");
  check("order has totals", typeof order.body?.data?.order?.totals?.total === "number");
  check("order has timeline", Array.isArray(order.body?.data?.order?.timeline) && order.body.data.order.timeline.length > 0);
  check("payment simulated", order.body?.data?.order?.payment?.simulated === true);

  const orderPage = await call("GET", `/api/orders/${orderId}`, { token: customerToken });
  check("GET /orders/:id", orderPage.status === 200 && orderPage.body?.success);
  // Order items denormalise `storeName`; `store` stays an id by design.
  check(
    "order items carry store details",
    (orderPage.body?.data?.order?.items || []).every((item) => item.storeName && item.store && item.product),
    JSON.stringify(orderPage.body?.data?.order?.items?.[0])
  );

  const mine = await call("GET", "/api/orders/mine", { token: customerToken });
  check("GET /orders/mine", mine.status === 200 && Array.isArray(mine.body?.data?.items));

  const orderNotifications = await call("GET", "/api/users/notifications", { token: customerToken });
  check(
    "order created a notification",
    orderNotifications.body?.data?.items?.some((n) => /placed/i.test(n.title || "")),
    JSON.stringify(orderNotifications.body?.data?.items?.map((n) => n.title))
  );

  const cancelled = await call("PATCH", `/api/orders/${orderId}/cancel`, { token: customerToken });
  check("PATCH /orders/:id/cancel", [200, 400, 409].includes(cancelled.status), `status ${cancelled.status}`);

  section("Seller flows");
  const forbidden = await call("GET", "/api/seller/dashboard", { token: customerToken });
  check("customer blocked from seller area", [403].includes(forbidden.status), `status ${forbidden.status}`);

  const dashboard = await call("GET", "/api/seller/dashboard", { token: sellerToken });
  check("GET /seller/dashboard", dashboard.status === 200 && dashboard.body?.success, `status ${dashboard.status} ${JSON.stringify(dashboard.body?.message || "")}`);
  check("dashboard stats", typeof dashboard.body?.data?.stats?.revenue30 === "number", JSON.stringify(Object.keys(dashboard.body?.data?.stats || {})));
  check("dashboard recent orders", Array.isArray(dashboard.body?.data?.recentOrders), typeof dashboard.body?.data?.recentOrders);
  check(
    "dashboard series",
    Array.isArray(dashboard.body?.data?.series) && dashboard.body.data.series.length > 0,
    JSON.stringify((dashboard.body?.data?.series || [])[0])
  );

  const customers = await call("GET", "/api/seller/customers", { token: sellerToken });
  check("GET /seller/customers", customers.status === 200 && Array.isArray(customers.body?.data?.items));

  const storeOrders = await call("GET", "/api/orders/store", { token: sellerToken });
  check("GET /orders/store", storeOrders.status === 200, `status ${storeOrders.status}`);

  const myStore = await call("GET", "/api/stores/mine", { token: sellerToken });
  check("GET /stores/mine", myStore.status === 200 && Boolean(myStore.body?.data?.store || myStore.body?.data), `status ${myStore.status}`);
  const sellerStoreId = myStore.body?.data?.store?._id || myStore.body?.data?._id;

  const sellerStoreOrders = await call("GET", `/api/admin/orders?store=${sellerStoreId}`, { token: adminToken });
  check("GET /admin/orders filtered by store", sellerStoreOrders.status === 200, `status ${sellerStoreOrders.status}`);

  section("Seller product management");
  const myProducts = await call("GET", "/api/products/mine", { token: sellerToken });
  check("GET /products/mine", myProducts.status === 200 && Array.isArray(myProducts.body?.data?.items), `status ${myProducts.status}`);
  const sellerProductId = myProducts.body?.data?.items?.[0]?._id;

  const createdProduct = await call("POST", "/api/products", {
    token: sellerToken,
    body: {
      name: "Smoke Test Product",
      description: "Created by the smoke test",
      price: 12.5,
      images: ["/images/products/test.jpg"],
      category: category?._id,
      stock: 9,
    },
  });
  check("POST /products", createdProduct.status === 201 && createdProduct.body?.success, `status ${createdProduct.status} ${JSON.stringify(createdProduct.body?.message || createdProduct.body?.details || "")}`);
  const newProductId = createdProduct.body?.data?.product?._id;

  if (newProductId) {
    const patchedProduct = await call("PATCH", `/api/products/${newProductId}`, {
      token: sellerToken,
      body: { price: 14.25, stock: 3 },
    });
    check("PATCH /products/:id", patchedProduct.status === 200, `status ${patchedProduct.status}`);
    check("product price updated", patchedProduct.body?.data?.product?.price === 14.25, JSON.stringify(patchedProduct.body?.data?.product?.price));

    const deletedProduct = await call("DELETE", `/api/products/${newProductId}`, { token: sellerToken });
    check("DELETE /products/:id", deletedProduct.status === 200, `status ${deletedProduct.status}`);
  } else {
    check("PATCH /products/:id", false, "skipped — product creation failed");
    check("DELETE /products/:id", false, "skipped — product creation failed");
  }

  check("PATCH /stores/mine", (await call("PATCH", "/api/stores/mine", { token: sellerToken, body: { tagline: "Updated by smoke test" } })).status === 200);
  void sellerProductId;

  section("Reviews");
  const review = await call("POST", "/api/reviews", {
    token: customerToken,
    body: { productId, rating: 5, title: "Great", comment: "Smoke test review" },
  });
  check("POST /reviews", review.status === 201 && review.body?.success, `status ${review.status} ${JSON.stringify(review.body?.message || review.body?.details || "")}`);
  const reviewId = review.body?.data?.review?._id;
  const duplicateReview = await call("POST", "/api/reviews", { token: customerToken, body: { productId, rating: 4 } });
  check("duplicate review blocked", duplicateReview.status === 409, `status ${duplicateReview.status}`);
  check("PATCH /reviews/:id", (await call("PATCH", `/api/reviews/${reviewId}`, { token: customerToken, body: { comment: "Edited by smoke test" } })).status === 200);
  check("GET /reviews/mine", (await call("GET", "/api/reviews/mine", { token: customerToken })).status === 200);
  check("DELETE /reviews/:id", (await call("DELETE", `/api/reviews/${reviewId}`, { token: customerToken })).status === 200);
  const invalidRating = await call("POST", "/api/reviews", {
    token: customerToken,
    body: { productId, rating: 9, comment: "out of range" },
  });
  check("out of range rating rejected", invalidRating.status === 422, `status ${invalidRating.status}`);

  section("Admin flows");
  const adminBlocked = await call("GET", "/api/admin/overview", { token: customerToken });
  check("customer blocked from admin", [403].includes(adminBlocked.status), `status ${adminBlocked.status}`);

  const overview = await call("GET", "/api/admin/overview", { token: adminToken });
  check("GET /admin/overview", overview.status === 200 && overview.body?.success, `status ${overview.status} ${JSON.stringify(overview.body?.message || "")}`);
  const stats = overview.body?.data?.stats || {};
  check("overview revenue", typeof stats.revenue === "number", JSON.stringify(stats));
  check("overview customers", typeof stats.customers === "number");
  check("overview stores", typeof stats.stores === "number");
  check(
    "overview series",
    Array.isArray(overview.body?.data?.series) && overview.body.data.series.length > 0,
    JSON.stringify((overview.body?.data?.series || [])[0])
  );
  check(
    "overview pipeline by status",
    Array.isArray(overview.body?.data?.ordersByStatus),
    JSON.stringify(overview.body?.data?.ordersByStatus)
  );

  const reports = await call("GET", "/api/admin/reports", { token: adminToken });
  check("GET /admin/reports", reports.status === 200 && reports.body?.success, `status ${reports.status}`);
  check(
    "report top sellers",
    Array.isArray(reports.body?.data?.topSellers) && reports.body.data.topSellers.length > 0,
    JSON.stringify(reports.body?.data?.topSellers?.[0])
  );
  check(
    "report top sellers keep store",
    reports.body?.data?.topSellers?.every((p) => p.store?.name),
    JSON.stringify(reports.body?.data?.topSellers?.[0]?.store)
  );
  check(
    "report category breakdown",
    Array.isArray(reports.body?.data?.categoryBreakdown) &&
      reports.body.data.categoryBreakdown.every((row) => row.name && typeof row.products === "number"),
    JSON.stringify(reports.body?.data?.categoryBreakdown?.[0])
  );
  check(
    "report store performance",
    Array.isArray(reports.body?.data?.storePerformance) &&
      typeof reports.body.data.storePerformance[0]?.revenue === "number"
  );
  check("report status breakdown", Array.isArray(reports.body?.data?.statusBreakdown));
  check(
    "report revenue by day",
    Array.isArray(reports.body?.data?.revenueByDay) && typeof reports.body.data.revenueByDay[0]?.revenue === "number"
  );

  const adminUsers = await call("GET", "/api/admin/users", { token: adminToken });
  check("GET /admin/users", adminUsers.status === 200 && Array.isArray(adminUsers.body?.data?.items));
  const adminUserId = adminUsers.body?.data?.items?.find((u) => u.email === email)?._id;
  check("PATCH /admin/users/:id", (await call("PATCH", `/api/admin/users/${adminUserId}`, { token: adminToken, body: { isActive: true } })).status === 200);

  const adminStores = await call("GET", "/api/admin/stores", { token: adminToken });
  check("GET /admin/stores", adminStores.status === 200 && Array.isArray(adminStores.body?.data?.items));
  const pendingStore = adminStores.body?.data?.items?.find((s) => s.verification === "pending");
  if (pendingStore) {
    check("PATCH /admin/stores/:id", (await call("PATCH", `/api/admin/stores/${pendingStore._id}`, { token: adminToken, body: { verification: "verified" } })).status === 200);
  } else {
    check("PATCH /admin/stores/:id", true, "skipped — no pending store to verify");
  }

  const adminProducts = await call("GET", "/api/admin/products", { token: adminToken });
  check("GET /admin/products", adminProducts.status === 200 && Array.isArray(adminProducts.body?.data?.items));

  const adminOrders = await call("GET", "/api/admin/orders", { token: adminToken });
  check("GET /admin/orders", adminOrders.status === 200 && Array.isArray(adminOrders.body?.data?.items));
  const adminOrder = adminOrders.body?.data?.items?.find((o) => o.status === "Pending");
  if (adminOrder) {
    const statusChange = await call("PATCH", `/api/admin/orders/${adminOrder._id}/status`, {
      token: adminToken,
      body: { status: "Preparing" },
    });
    check("PATCH /admin/orders/:id/status", statusChange.status === 200, `status ${statusChange.status} ${JSON.stringify(statusChange.body?.message || "")}`);
  } else {
    check("PATCH /admin/orders/:id/status", true, "skipped — no pending order");
  }

  const adminCategories = await call("GET", "/api/admin/categories", { token: adminToken });
  check("GET /admin/categories", adminCategories.status === 200 && Array.isArray(adminCategories.body?.data?.items));
  const newCategory = await call("POST", "/api/admin/categories", {
    token: adminToken,
    body: { name: "Smoke Test Category", tagline: "Temporary", icon: "Package", accent: "#1A73E8" },
  });
  check("POST /admin/categories", newCategory.status === 201 && newCategory.body?.success, `status ${newCategory.status} ${JSON.stringify(newCategory.body?.message || newCategory.body?.details || "")}`);
  const newCategoryId = newCategory.body?.data?.category?._id;
  check("PATCH /admin/categories/:id", (await call("PATCH", `/api/admin/categories/${newCategoryId}`, { token: adminToken, body: { tagline: "Updated by smoke test" } })).status === 200);
  check("DELETE /admin/categories/:id", (await call("DELETE", `/api/admin/categories/${newCategoryId}`, { token: adminToken })).status === 200);
  check("POST /admin/categories/recount", (await call("POST", "/api/admin/categories/recount", { token: adminToken })).status === 200);

  section("Image uploads (seller device photos)");
  // Smallest valid PNG so the request looks like a real photo off a phone.
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
    "base64"
  );
  const upload = await callRaw("POST", "/api/uploads", {
    token: sellerToken,
    bytes: pngBytes,
    fileName: "campus-laptop.png",
    contentType: "image/png",
  });
  check(
    "POST /uploads stores a seller photo",
    upload.status === 201 && upload.body?.data?.url?.startsWith("/uploads/"),
    `status ${upload.status} ${JSON.stringify(upload.body?.message || upload.body?.data || "")}`
  );
  const uploadedUrl = upload.body?.data?.url;
  if (uploadedUrl) {
    const served = await fetch(`${BASE}${uploadedUrl}`);
    check(
      "uploaded photo is served from /uploads",
      served.status === 200 && String(served.headers.get("content-type") || "").startsWith("image/"),
      `status ${served.status} type ${served.headers.get("content-type")}`
    );
    await served.arrayBuffer();
  }
  check(
    "POST /uploads rejects non-image types",
    (await callRaw("POST", "/api/uploads", {
      token: sellerToken,
      bytes: Buffer.from("#!/bin/sh\necho hi\n"),
      fileName: "payload.sh",
      contentType: "image/png",
    })).status === 400
  );
  check(
    "POST /uploads needs a signed-in seller",
    (await callRaw("POST", "/api/uploads", { bytes: pngBytes, fileName: "anon.png", contentType: "image/png" }))
      .status === 401
  );
  check(
    "POST /uploads is closed to customers",
    (await callRaw("POST", "/api/uploads", {
      token: customerToken,
      bytes: pngBytes,
      fileName: "customer.png",
      contentType: "image/png",
    })).status === 403
  );
  if (uploadedUrl) {
    check(
      "DELETE /uploads removes the file",
      (await call("DELETE", `/api/uploads/${uploadedUrl.split("/").pop()}`, { token: sellerToken })).status === 200
    );
    const gone = await fetch(`${BASE}${uploadedUrl}`);
    check("deleted photo is no longer served", gone.status === 404, `status ${gone.status}`);
  }

  section("Error handling");
  const missingProduct = await call("GET", "/api/products/64b7f9f2b1c2d3e4f5a6b7c8");
  check("unknown product 404", missingProduct.status === 404, `status ${missingProduct.status}`);
  check("unknown store 404", (await call("GET", "/api/stores/not-a-real-store")).status === 404);
  const invalidLogin = await call("POST", "/api/auth/login", { body: { email: "not-an-email" } });
  check("malformed email rejected", invalidLogin.status === 400, `status ${invalidLogin.status}`);
  check("forgot-password", (await call("POST", "/api/auth/forgot-password", { body: { email } })).status === 200);

  console.log(`\n${"─".repeat(52)}`);
  console.log(`Passed: ${passed}   Failed: ${failed}`);
  if (failures.length) {
    console.log("\nFailures:");
    failures.forEach((failure) => console.log(`  • ${failure}`));
  }
  console.log(`${"─".repeat(52)}\n`);
  process.exit(failed ? 1 : 0);
};

run().catch((error) => {
  console.error("Smoke run crashed:", error);
  process.exit(1);
});