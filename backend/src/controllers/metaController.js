const env = require("../config/env");
const { UNIVERSITIES } = require("../data/universities");
const Store = require("../models/Store");
const Product = require("../models/Product");

const universities = async (_req, res) => {
  const counts = await Store.aggregate([
    { $unwind: "$location.universities" },
    { $group: { _id: "$location.universities", stores: { $sum: 1 } } },
  ]);

  const items = UNIVERSITIES.map((university) => ({
    ...university,
    storeCount: counts.find((row) => row._id === university.code)?.stores || 0,
  }));

  res.json({ success: true, data: { items } });
};

const config = async (_req, res) => {
  const [storeCount, productCount] = await Promise.all([
    Store.countDocuments({ status: "active" }),
    Product.countDocuments({ status: "active" }),
  ]);

  res.json({
    success: true,
    data: {
      pricing: {
        taxRate: env.taxRate,
        serviceFeeRate: env.serviceFeeRate,
        defaultDeliveryFee: env.defaultDeliveryFee,
        freeDeliveryThreshold: env.freeDeliveryThreshold,
      },
      marketplace: { storeCount, productCount },
      orderStatuses: [
        "Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled",
      ],
      paymentMode: "demo",
    },
  });
};

module.exports = { universities, config };
