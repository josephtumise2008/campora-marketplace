const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: { type: String, trim: true, default: "Home" },
    recipient: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    instructions: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["dorm", "apartment", "home", "office", "other"],
      default: "dorm",
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1, isDefault: -1 });

module.exports = mongoose.models.Address || mongoose.model("Address", addressSchema);
