const mongoose = require("mongoose");

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 140,
    },
    slug: { type: String, index: true },
    description: { type: String, trim: true, maxlength: 400, default: "" },
    details: { type: String, trim: true, maxlength: 4000, default: "" },
    price: { type: Number, required: [true, "Price is required"], min: 0 },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: "" },
    tags: { type: [String], default: [], index: true },
    specs: { type: [specSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    deal: {
      isDeal: { type: Boolean, default: false, index: true },
      badge: { type: String, default: "" },
    },
    featured: { type: Boolean, default: false, index: true },
    soldCount: { type: Number, default: 0 },
    unit: { type: String, default: "each" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } },
  }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ "rating.average": -1, soldCount: -1 });

productSchema.virtual("discountPercent").get(function discountPercent() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

productSchema.virtual("inStock").get(function inStock() {
  return (this.stock || 0) > 0;
});

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
