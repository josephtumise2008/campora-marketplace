"use strict";

/**
 * In-memory database fallback.
 *
 * When MongoDB cannot be reached, Campora swaps Mongoose's model factory for
 * an in-memory implementation. The model files, controllers, routes and seed
 * data are untouched: they keep calling `mongoose.model(name, schema)` and
 * keep using the same query API, so a demo machine without a database gets
 * the identical API surface backed by process memory.
 *
 * Data lives for the lifetime of the process and is re-seeded on boot.
 */

const mongoose = require("mongoose");

const { patchSchemaHooks } = require("./document");
const { createModel } = require("./model");

// Models are keyed by model name *and* collection name so aggregation
// `$lookup: { from: "categories" }` resolves the way it does in MongoDB.
const registry = new Map();

let enabled = false;

const enable = () => {
  if (enabled) return registry;

  patchSchemaHooks();
  enabled = true;

  const nativeModel = mongoose.model.bind(mongoose);
  const nativeDeleteModel = mongoose.deleteModel.bind(mongoose);

  mongoose.model = function model(name, schema, collection, options) {
    if (typeof name === "function") return nativeModel(name);
    if (schema && typeof schema === "object" && schema.tree) {
      return createModel(name, schema, registry);
    }
    return nativeModel(name, schema, collection, options);
  };

  mongoose.deleteModel = function deleteModel(name) {
    const model = getModel(name);
    if (model) {
      registry.delete(model.modelName);
      registry.delete(model.collection.name);
    }
    delete mongoose.models[name];
    return mongoose;
  };

  mongoose.isMemoryDb = true;

  /* eslint-disable no-console */
  console.log("Campora is using the in-memory database (no MongoDB connection).");
  /* eslint-enable no-console */

  return registry;
};

const isEnabled = () => enabled;

const getRegistry = () => registry;

const getModel = (name) => {
  if (registry.has(name)) return registry.get(name);
  const lowered = String(name || "").toLowerCase();
  for (const [key, model] of registry.entries()) {
    if (key.toLowerCase() === lowered) return model;
  }
  return undefined;
};

const uniqueModels = () => [...new Set(registry.values())];

const collectionCounts = () => {
  const counts = {};
  for (const model of uniqueModels()) {
    counts[model.collection.name] = model.docs.length;
  }
  return counts;
};

const clearAll = async () => {
  for (const model of uniqueModels()) {
    await model.deleteMany({});
  }
};

module.exports = {
  clearAll,
  collectionCounts,
  enable,
  getModel,
  getRegistry,
  isEnabled,
  registry,
};