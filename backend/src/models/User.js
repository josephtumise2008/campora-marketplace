const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Home" },
    recipient: { type: String, trim: true, required: true },
    line1: { type: String, trim: true, required: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    zip: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, default: "" },
    instructions: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const notificationPrefsSchema = new mongoose.Schema(
  {
    orderUpdates: { type: Boolean, default: true },
    deals: { type: Boolean, default: true },
    priceDrops: { type: Boolean, default: true },
    campusDigest: { type: Boolean, default: false },
  },
  { _id: false }
);

const paymentPrefsSchema = new mongoose.Schema(
  {
    savedCardBrand: { type: String, default: "" },
    savedCardLast4: { type: String, default: "" },
    savedCardExpiry: { type: String, default: "" },
    demoMode: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    phone: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, trim: true, maxlength: 400, default: "" },
    university: {
      code: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    addresses: { type: [addressSchema], default: [] },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    favoriteStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    recentSearches: { type: [String], default: [] },
    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) },
    paymentPrefs: { type: paymentPrefsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.virtual("wishlistCount").get(function wishlistCount() {
  return this.wishlist ? this.wishlist.length : 0;
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
