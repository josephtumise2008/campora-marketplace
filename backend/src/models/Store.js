const mongoose = require("mongoose");

const hoursSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    open: { type: String, default: "9:00 AM" },
    close: { type: String, default: "9:00 PM" },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: 90,
    },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    tagline: { type: String, trim: true, maxlength: 140, default: "" },
    description: { type: String, trim: true, maxlength: 4000, default: "" },
    logo: { type: String, default: "" },
    cover: { type: String, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    verification: {
      type: String,
      enum: ["pending", "verified", "suspended"],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    location: {
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      zip: { type: String, trim: true, default: "" },
      universities: { type: [String], default: [] },
    },
    delivery: {
      fee: { type: Number, default: 2.99, min: 0 },
      freeThreshold: { type: Number, default: 35, min: 0 },
      etaMinutes: { type: Number, default: 40, min: 5 },
      methods: { type: [String], default: ["Delivery", "Pickup"] },
      minimumOrder: { type: Number, default: 0, min: 0 },
    },
    contact: {
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
    hours: { type: [hoursSchema], default: [] },
    policies: {
      returns: { type: String, default: "" },
      delivery: { type: String, default: "" },
      substitutions: { type: String, default: "" },
    },
    promo: {
      headline: { type: String, default: "" },
      code: { type: String, default: "" },
      discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    },
    featured: { type: Boolean, default: false, index: true },
    stats: {
      orders: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      products: { type: Number, default: 0 },
      repeatRate: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } },
  }
);

storeSchema.index({ name: "text", tagline: "text", description: "text" });
storeSchema.index({ "location.universities": 1 });

module.exports = mongoose.models.Store || mongoose.model("Store", storeSchema);
