"use strict";

/**
 * Database bootstrap.
 *
 * Campora prefers MongoDB. When the database cannot be reached it falls back
 * to a Mongoose-compatible in-memory database and seeds it automatically, so
 * a demo machine without MongoDB still gets the full API.
 *
 * Set `CAMPORA_MEMORY_DB=true` (or `MEMORY_DB=true`) to force the fallback.
 */

const mongoose = require("mongoose");

const env = require("./env");

let mode = "mongo";

const startMemory = async () => {
  const memory = require("./memory");
  memory.enable();

  if (env.forceMemoryDb) {
    const { seedDatabase } = require("../data/seedDatabase");
    const counts = await seedDatabase({ quiet: true });
    console.log(
      `In-memory database ready: ${counts.products} products, ${counts.stores} stores, ${counts.orders} orders.`
    );
  }
};

const connectDB = async ({ seedMemory = true } = {}) => {
  if (env.forceMemoryDb) {
    mode = "memory";
    await startMemory();
    return mode;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log(`Campora MongoDB connected (${env.mongoUri.replace(/\/\/.*@/, "//")})`);
    mode = "mongo";
    return mode;
  } catch (error) {
    const reason = String(error.message || error).split("\n")[0];
    console.warn(`MongoDB unavailable — ${reason}`);
    console.warn("Falling back to the Campora in-memory database (data resets on restart).");

    mode = "memory";
    await mongoose.disconnect().catch(() => {});
    await startMemory();

    if (seedMemory) {
      const started = Date.now();
      const { seedDatabase } = require("../data/seedDatabase");
      const counts = await seedDatabase({ quiet: true });
      console.log(
        `In-memory database seeded in ${Date.now() - started}ms: ` +
          `${counts.products} products, ${counts.stores} stores, ${counts.orders} orders, ` +
          `${counts.reviews} reviews.`
      );
    }
    return mode;
  }
};

connectDB.mode = () => mode;

module.exports = connectDB;