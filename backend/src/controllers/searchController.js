const Product = require("../models/Product");
const Store = require("../models/Store");
const Category = require("../models/Category");
const { getPagination, paginated } = require("../utils/pagination");

const escapeRx = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const search = async (req, res) => {
  const term = String(req.query.q || "").trim();
  const { page, limit, skip } = getPagination({ ...req.query, limit: 8 }, 24);
  const scope = String(req.query.scope || "all");

  if (!term) {
    return res.json({
      success: true,
      data: {
        query: "",
        products: paginated([], 0, { page: 1, limit }),
        stores: [],
        categories: [],
        suggestions: [],
        total: 0,
      },
    });
  }

  const rx = new RegExp(escapeRx(term), "i");
  const sort = { "rating.average": -1, soldCount: -1 };

  const [products, stores, categories] = await Promise.all([
    scope === "stores"
      ? []
      : Product.find({ status: "active", $or: [{ name: rx }, { description: rx }, { tags: rx }] })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("store", "name slug logo rating verification")
          .populate("category", "name slug icon accent")
          .lean(),
    scope === "products"
      ? []
      : Store.find({ status: "active", $or: [{ name: rx }, { tagline: rx }, { description: rx }] })
          .sort({ featured: -1, "rating.average": -1 })
          .limit(6)
          .lean(),
    scope === "products" || scope === "stores"
      ? []
      : Category.find({ status: "active", $or: [{ name: rx }, { tagline: rx }] })
          .sort({ order: 1 })
          .limit(6)
          .lean(),
  ]);

  const productTotal = await Product.countDocuments({
    status: "active",
    $or: [{ name: rx }, { description: rx }, { tags: rx }],
  });

  const suggestions = [];
  if (scope !== "stores") {
    suggestions.push(
      ...products.slice(0, 4).map((p) => ({
        type: "product",
        id: p._id,
        label: p.name,
        sublabel: p.store?.name || "",
        image: p.images?.[0] || "",
        price: p.price,
        href: `/products/${p._id}`,
      }))
    );
  }
  if (scope !== "products") {
    suggestions.push(
      ...stores.slice(0, 3).map((s) => ({
        type: "store",
        id: s._id,
        label: s.name,
        sublabel: `${s.rating.average.toFixed(1)} ★ · ${s.location.city}`,
        image: s.logo,
        href: `/stores/${s.slug}`,
      }))
    );
    suggestions.push(
      ...categories.slice(0, 2).map((c) => ({
        type: "category",
        id: c._id,
        label: c.name,
        sublabel: c.tagline,
        image: c.image,
        href: `/category/${c.slug}`,
      }))
    );
  }

  res.json({
    success: true,
    data: {
      query: term,
      products: paginated(products, productTotal, { page, limit }),
      stores,
      categories,
      suggestions,
      total: productTotal + stores.length + categories.length,
    },
  });
};

module.exports = { search };
