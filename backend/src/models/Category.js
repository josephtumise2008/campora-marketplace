const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    icon: { type: String, default: "Package" },
    accent: { type: String, default: "#1A73E8" },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "hidden"], default: "active" },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
