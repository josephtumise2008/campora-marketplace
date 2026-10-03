const Order = require("../models/Order");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const { calculateTotals, buildOrderNumber, round2 } = require("../services/pricingService");
const { getPagination, paginated } = require("../utils/pagination");

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
 * Local demo payment simulation. No external gateway, no credentials.
 * A card number that fails Luhn validation is rejected so the checkout form
 * has real validation behaviour, and the stored reference is derived from the
 * order number so it is clearly marked as simulated.
 */
const simulatePayment = ({ method, cardNumber, expiry, cvc, orderNumber }) => {
  const digits = String(cardNumber || "").replace(/\D/g, "");

  if (method === "Demo Card") {
    if (digits.length < 13 || digits.length > 19) {
      throw ApiError.badRequest("Enter a card number between 13 and 19 digits");
    }
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let value = Number(digits[i]);
      if (double) {
        value *= 2;
        if (value > 9) value -= 9;
      }
      sum += value;
      double = !double;
    }
    if (sum % 10 !== 0) {
      throw ApiError.badRequest("That card number failed the demo card check. Try 4242 4242 4242 4242.");
    }
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(String(expiry || ""))) {
      throw ApiError.badRequest("Enter the expiry date as MM/YY");
    }
    if (!/^\d{3,4}$/.test(String(cvc || ""))) {
      throw ApiError.badRequest("Enter the 3 or 4 digit security code");
    }
  }

  const brand = digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : digits.startsWith("3") ? "Amex" : "Demo";
  return {
    method: method || "Demo Card",
    status: "paid",
    brand,
    last4: digits.slice(-4) || "0000",
    simulated: true,
    reference: `demo_${orderNumber.toLowerCase()}`,
  };
};

const create = async (req, res) => {
  const { items, deliveryAddress, deliveryMethod, payment, customerNote, promotion, scheduledFor } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }
  if (!deliveryAddress?.line1 || !deliveryAddress?.city || !deliveryAddress?.zip) {
    throw ApiError.badRequest("A complete delivery address is required");
  }

  const ids = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: ids }, status: "active" }).populate(
    "store",
    "name delivery"
  );

  if (products.length !== ids.length) {
    throw ApiError.badRequest("One or more items in your cart are no longer available");
  }

  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  const orderItems = [];
  const storeIds = new Set();

  for (const item of items) {
    const product = byId.get(String(item.productId));
    const quantity = Math.max(1, Number(item.quantity) || 1);
    if (product.stock < quantity) {
      throw ApiError.badRequest(
        `${product.name} only has ${product.stock} left — please update your cart`
      );
    }
    storeIds.add(product.store._id);
    orderItems.push({
      product: product._id,
      store: product.store._id,
      storeName: product.store.name,
      name: product.name,
      image: product.images?.[0] || "",
      price: product.price,
      quantity,
      lineTotal: round2(product.price * quantity),
      status: "Pending",
    });
  }

  const stores = await Store.find({ _id: { $in: [...storeIds] } }).select(
    "name delivery.fee delivery.freeThreshold"
  );
  const storeById = new Map(stores.map((s) => [s._id.toString(), s]));

  const subtotal = round2(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));

  let deliveryFee = 0;
  if (deliveryMethod !== "Pickup") {
    for (const storeId of storeIds) {
      const store = storeById.get(storeId.toString());
      const fee = store?.delivery?.fee ?? 2.99;
      const threshold = store?.delivery?.freeThreshold ?? 0;
      const storeSubtotal = round2(
        orderItems
          .filter((item) => item.store.toString() === storeId.toString())
          .reduce((sum, item) => sum + item.lineTotal, 0)
      );
      deliveryFee += threshold > 0 && storeSubtotal >= threshold ? 0 : fee;
    }
    deliveryFee = round2(deliveryFee);
  }

  let discount = 0;
  let appliedCode = "";
  if (promotion?.code) {
    const code = String(promotion.code).toUpperCase();
    const match = stores.find((s) => s.promo?.code === code);
    const globalPromo = await Store.findOne({ "promo.code": code, status: "active" });
    const store = match || globalPromo;
    if (store?.promo?.discountPercent > 0) {
      appliedCode = code;
      discount = round2(subtotal * (store.promo.discountPercent / 100));
    }
  }

  const totals = calculateTotals({ subtotal, deliveryFee, discount });
  const orderNumber = buildOrderNumber();
  const paymentResult = simulatePayment({
    method: payment?.method,
    cardNumber: payment?.cardNumber,
    expiry: payment?.expiry,
    cvc: payment?.cvc,
    orderNumber,
  });

  const order = await Order.create({
    orderNumber,
    customer: req.user._id,
    items: orderItems,
    status: "Pending",
    totals,
    deliveryAddress,
    deliveryMethod: deliveryMethod || "Delivery",
    scheduledFor: scheduledFor || undefined,
    payment: paymentResult,
    promotion: { code: appliedCode, discountPercent: appliedCode ? promotion.discountPercent || 0 : 0 },
    customerNote: customerNote || "",
    timeline: [
      { status: "Pending", label: STATUS_LABELS.Pending, note: "Payment authorised in demo mode", at: new Date() },
    ],
    placedAt: new Date(),
  });

  // Decrement stock now that the order exists.
  await Promise.all(
    orderItems.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity, soldCount: item.quantity } })
    )
  );

  await Promise.all(
    [...storeIds].map((storeId) =>
      Store.updateOne(
        { _id: storeId },
        {
          $inc: { "stats.orders": 1, "stats.revenue": totals.subtotal },
        }
      )
    )
  );

  await Notification.create({
    user: req.user._id,
    type: "order",
    title: `Order ${orderNumber} placed`,
    body: `${orderItems.length} item${orderItems.length > 1 ? "s" : ""} from ${orderItems.length > 1 ? `${storeIds.size} stores` : orderItems[0].storeName}. Total $${totals.total.toFixed(2)}.`,
    link: `/account/orders/${order._id}`,
  });

  await Promise.all(
    [...storeIds].map((storeId) =>
      Store.findById(storeId).then((store) =>
        Notification.create({
          user: store.owner,
          type: "order",
          title: `New order ${orderNumber}`,
          body: `${orderItems.length} item${orderItems.length > 1 ? "s" : ""} for $${totals.subtotal.toFixed(2)} at ${store?.name || "your store"}.`,
          link: `/seller/orders`,
        })
      )
    )
  );

  const user = await User.findById(req.user._id);
  if (paymentResult.brand && paymentResult.last4) {
    user.paymentPrefs = {
      ...user.paymentPrefs,
      savedCardBrand: paymentResult.brand,
      savedCardLast4: paymentResult.last4,
      savedCardExpiry: String(payment?.expiry || ""),
    };
    await user.save();
  }

  res.status(201).json({ success: true, data: { order } });
};

const listMine = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginated(items, total, { page, limit }) });
};

const getMine = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).lean();
  if (!order) throw ApiError.notFound("We could not find that order on your account");
  res.json({ success: true, data: { order } });
};

const cancel = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound("We could not find that order on your account");
  if (!["Pending", "Confirmed"].includes(order.status)) {
    throw ApiError.conflict(`An order that is already ${order.status.toLowerCase()} cannot be cancelled`);
  }

  order.status = "Cancelled";
  order.timeline.push({ status: "Cancelled", label: STATUS_LABELS.Cancelled, note: "Cancelled by customer", at: new Date() });
  await order.save();

  await Promise.all(
    order.items.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, soldCount: -item.quantity } })
    )
  );

  res.json({ success: true, data: { order } });
};

const storeOrders = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw ApiError.forbidden("You do not have a store yet");

  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { "items.store": store._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.orderNumber = new RegExp(
      String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("customer", "name email avatar").lean(),
    Order.countDocuments(filter),
  ]);

  const shaped = orders.map((order) => {
    const items = order.items.filter((item) => item.store.toString() === store._id.toString());
    const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));
    return { ...order, items, storeSubtotal: subtotal };
  });

  res.json({ success: true, data: paginated(shaped, total, { page, limit }) });
};

const ALLOWED_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Ready", "Cancelled"],
  Ready: ["Out for Delivery", "Delivered", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const updateStatus = async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw ApiError.forbidden("You do not have a store yet");

  const order = await Order.findOne({ _id: req.params.id, "items.store": store._id });
  if (!order) throw ApiError.notFound("That order is not for your store");

  const next = req.body.status;
  if (!STATUS_LABELS[next]) throw ApiError.badRequest("That order status is not recognised");
  if (order.status === next) throw ApiError.badRequest(`This order is already ${next.toLowerCase()}`);

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(next)) {
    throw ApiError.conflict(`An order that is ${order.status.toLowerCase()} cannot move to ${next.toLowerCase()}`);
  }

  order.status = next;
  order.items.forEach((item) => {
    if (item.store.toString() === store._id.toString()) item.status = next;
  });
  order.timeline.push({ status: next, label: STATUS_LABELS[next], note: req.body.note || `Updated by ${store.name}`, at: new Date() });
  if (next === "Delivered") order.deliveredAt = new Date();
  await order.save();

  if (req.user.id !== order.customer.toString()) {
    await Notification.create({
      user: order.customer,
      type: "order",
      title: `Order ${order.orderNumber} — ${next}`,
      body: `${store.name} updated your order to ${next.toLowerCase()}.`,
      link: `/account/orders/${order._id}`,
    });
  }

  res.json({ success: true, data: { order } });
};

const quote = async (req, res) => {
  const { items, deliveryMethod = "Delivery", promotion } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("There is nothing in your cart to price");
  }

  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } }).select("name price stock store images");
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = [];
  for (const item of items) {
    const product = byId.get(String(item.productId));
    if (!product) continue;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    lines.push({
      productId: product._id,
      store: product.store,
      name: product.name,
      image: product.images?.[0] || "",
      price: product.price,
      quantity,
      lineTotal: round2(product.price * quantity),
      available: product.stock >= quantity,
      stock: product.stock,
    });
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const storeIds = [...new Set(lines.map((l) => l.store.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).select("name delivery.fee delivery.freeThreshold");

  let deliveryFee = 0;
  if (deliveryMethod !== "Pickup") {
    for (const store of stores) {
      const fee = store.delivery?.fee ?? 2.99;
      const threshold = store.delivery?.freeThreshold ?? 0;
      const storeSubtotal = round2(
        lines.filter((l) => l.store.toString() === store._id.toString()).reduce((sum, l) => sum + l.lineTotal, 0)
      );
      deliveryFee += threshold > 0 && storeSubtotal >= threshold ? 0 : fee;
    }
    deliveryFee = round2(deliveryFee);
  }

  let discount = 0;
  let code = "";
  if (promotion?.code) {
    const store = await Store.findOne({ "promo.code": String(promotion.code).toUpperCase(), status: "active" });
    if (store?.promo?.discountPercent > 0) {
      code = store.promo.code;
      discount = round2(subtotal * (store.promo.discountPercent / 100));
    }
  }

  res.json({
    success: true,
    data: { lines, totals: calculateTotals({ subtotal, deliveryFee, discount }), appliedCode: code },
  });
};

module.exports = {
  create,
  listMine,
  getMine,
  cancel,
  storeOrders,
  updateStatus,
  quote,
  STATUS_LABELS,
};
