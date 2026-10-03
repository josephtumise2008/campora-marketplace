/* eslint-disable no-console */
"use strict";

/**
 * Standalone seed command: `npm run seed`.
 *
 * Clears the Campora collections and re-inserts the demo marketplace. When
 * Campora runs on the in-memory database the same seed runs automatically at
 * boot instead, because that data lives only in the process.
 */

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const memory = require("../config/memory");

const run = async () => {
  const mode = await connectDB({ seedMemory: false });

  if (memory.isEnabled()) {
    console.log("\nCampora is running on the in-memory database.");
    console.log("Seed data is created automatically whenever the API starts,");
    console.log("so this command has nothing to persist. Just run: npm run dev\n");
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  }

  // Required after connecting: the memory fallback swaps `mongoose.model`
  // before any schema module is evaluated.
  const { seedDatabase } = require("../data/seedDatabase");

  console.log(`Connected to MongoDB (${mode}). Seeding Campora…`);
  await seedDatabase();
  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("Seeding failed:", error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});