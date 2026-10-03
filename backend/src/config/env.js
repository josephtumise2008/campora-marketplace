const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const toList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campora",
  jwtSecret: process.env.JWT_SECRET || "campora_dev_secret_change_later",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  localOrigins: [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
],
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  // Force the in-memory demo database even when MongoDB is reachable.
  forceMemoryDb: /^(1|true|yes)$/i.test(
    process.env.CAMPORA_MEMORY_DB || process.env.MEMORY_DB || ""
  ),
  taxRate: Number(process.env.TAX_RATE || 0.05),
  serviceFeeRate: Number(process.env.SERVICE_FEE_RATE || 0.02),
  freeDeliveryThreshold: Number(process.env.FREE_DELIVERY_THRESHOLD || 35),
  defaultDeliveryFee: Number(process.env.DEFAULT_DELIVERY_FEE || 2.99),
  maxPageSize: 100,
};

env.allowedOrigins = Array.from(
  new Set([env.frontendUrl, ...env.localOrigins, ...toList(process.env.EXTRA_ORIGINS)])
);

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "campora_dev_secret_change_later")) {
  throw new Error("JWT_SECRET must be set to a unique value in production");
}

module.exports = env;
