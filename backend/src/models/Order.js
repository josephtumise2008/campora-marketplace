const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    storeName: { type: String, default: "" },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    label: { type: String, required: true },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], default: [] },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },
    totals: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    deliveryAddress: {
      recipient: { type: String, default: "" },
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zip: { type: String, default: "" },
      phone: { type: String, default: "" },
      instructions: { type: String, default: "" },
    },
    deliveryMethod: { type: String, default: "Delivery" },
    scheduledFor: { type: Date },
    payment: {
      method: { type: String, default: "Demo Card" },
      status: {
        type: String,
        enum: ["pending", "authorized", "paid", "refunded"],
        default: "pending",
      },
      brand: { type: String, default: "" },
      last4: { type: String, default: "" },
      simulated: { type: Boolean, default: true },
      reference: { type: String, default: "" },
    },
    promotion: {
      code: { type: String, default: "" },
      discountPercent: { type: Number, default: 0 },
    },
    customerNote: { type: String, default: "", maxlength: 400 },
    timeline: { type: [timelineSchema], default: [] },
    placedAt: { type: Date, default: Date.now, index: true },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } },
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.store": 1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
