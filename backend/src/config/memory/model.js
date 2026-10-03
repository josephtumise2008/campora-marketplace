"use strict";

/**
 * Mongoose-compatible model factory backed by in-memory collections.
 *
 * Only the surface Campora actually uses is implemented: `create`,
 * `insertMany`, `find`, `findOne`, `findById`, `findOneAndUpdate`,
 * `findOneAndDelete`, `aggregate`, `countDocuments`, `distinct`, the
 * `updateOne`/`updateMany`/`deleteOne`/`deleteMany` writers, and the query
 * chain `sort`/`skip`/`limit`/`select`/`populate`/`lean`.
 */

const mongoose = require("mongoose");

const { cloneValue, getPath, isPlainObject, setPath, unsetPath } = require("./support");
const { matchesFilter } = require("./match");
const { distinctValues, normalizeSelect, projectDoc, sortDocs } = require("./projection");
const { populateDocs } = require("./populate");

const { runPipeline } = require("./aggregate");
const {
  MemoryDocument,
  assertUnique,
  cloneDocument,
  buildFromSchema,
  patchSchemaHooks,
  timestampFields,
  validateDoc,
} = require("./document");

const ObjectId = mongoose.Types.ObjectId;

const UPDATE_OPERATORS = new Set([
  "$set",
  "$inc",
  "$unset",
  "$push",
  "$addToSet",
  "$pull",
  "$pullAll",
  "$setOnInsert",
  "$min",
  "$max",
  "$rename",
]);

const isPlainObjectFilter = (value) => isPlainObject(value);

/* ------------------------------------------------------------------ *
 * Query builder
 * ------------------------------------------------------------------ */

class MemoryQuery {
  constructor(model, { filter = {}, single = false } = {}) {
    this.model = model;
    this.filter = isPlainObjectFilter(filter) ? filter : {};
    this._single = single;
    this._sort = null;
    this._skip = null;
    this._limit = null;
    this._selectArgs = [];
    this._populateArgs = [];
    this._lean = false;
  }

  sort(sort) {
    this._sort = sort;
    return this;
  }

  skip(skip) {
    this._skip = skip;
    return this;
  }

  limit(limit) {
    this._limit = limit;
    return this;
  }

  select(...args) {
    this._selectArgs.push(...args.filter(Boolean));
    return this;
  }

  populate(...args) {
    this._populateArgs.push(...args.filter(Boolean));
    return this;
  }

  lean(value = true) {
    this._lean = value !== false;
    return this;
  }

  setOptions(options = {}) {
    if (options.sort) this._sort = options.sort;
    if (options.skip) this._skip = options.skip;
    if (options.limit) this._limit = options.limit;
    if (options.select) this.select(options.select);
    if (options.populate) this.populate(options.populate);
    if (options.lean) this._lean = true;
    return this;
  }

  async exec() {
    const { model } = this;
    let docs = model.docs.filter((doc) => matchesFilter(doc, this.filter));

    docs = sortDocs(docs, this._sort);
    if (this._skip) docs = docs.slice(this._skip);
    if (this._limit !== null && this._limit !== undefined) docs = docs.slice(0, this._limit);

    // Populate replaces ids with documents. Work on copies so the stored
    // documents keep their references, the way Mongoose hydrates a per-query
    // result set.
    const rows = this._populateArgs.length ? docs.map((doc) => cloneDocument(doc)) : docs;

    if (this._populateArgs.length) {
      populateDocs(rows, this._populateArgs, model.schema, model.registry);
    }

    const projection = this._selectArgs.length
      ? normalizeSelect(this._selectArgs, model.schema)
      : null;

    const output = projection
      ? rows.map((doc) => projectDoc(doc, projection))
      : rows.map((doc) => doc.toObject({ virtuals: false }));

    if (this._single) {
      const first = output[0] ?? null;
      if (!first) return null;
      return this._lean ? first : rows[0];
    }

    if (!projection && !this._lean) return rows;
    return output;
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

/* ------------------------------------------------------------------ *
 * Update helpers
 * ------------------------------------------------------------------ */

const applyUpdate = (doc, update, { isInsert = false } = {}) => {
  if (!isPlainObject(update)) return doc;

  const operators = Object.keys(update).filter((key) => UPDATE_OPERATORS.has(key));
  if (!operators.length) {
    Object.assign(doc, cloneValue(update));
    return doc;
  }

  operators.forEach((operator) => {
    const payload = update[operator] || {};

    if (operator === "$set" || (operator === "$setOnInsert" && isInsert)) {
      Object.entries(payload).forEach(([path, value]) => setPath(doc, path, cloneValue(value)));
      return;
    }
    if (operator === "$inc") {
      Object.entries(payload).forEach(([path, amount]) => {
        const current = Number(getPath(doc, path) || 0);
        setPath(doc, path, current + Number(amount));
      });
      return;
    }
    if (operator === "$unset") {
      Object.keys(payload).forEach((path) => unsetPath(doc, path));
      return;
    }
    if (operator === "$min" || operator === "$max") {
      Object.entries(payload).forEach(([path, value]) => {
        const current = getPath(doc, path);
        if (current === undefined) setPath(doc, path, value);
        else if (operator === "$min" && value < current) setPath(doc, path, value);
        else if (operator === "$max" && value > current) setPath(doc, path, value);
      });
      return;
    }
    if (operator === "$push" || operator === "$addToSet") {
      Object.entries(payload).forEach(([path, value]) => {
        const list = getPath(doc, path);
        const target = Array.isArray(list) ? list.slice() : [];
        const values = value && typeof value === "object" && "$each" in value ? value.$each : [value];
        values.forEach((entry) => {
          const exists = target.some((item) => String(item) === String(entry));
          if (operator === "$push" || !exists) target.push(cloneValue(entry));
        });
        setPath(doc, path, target);
      });
      return;
    }
    if (operator === "$pull") {
      Object.entries(payload).forEach(([path, value]) => {
        const list = getPath(doc, path);
        if (!Array.isArray(list)) return;
        setPath(
          doc,
          path,
          list.filter((entry) => !matchesFilter(entry, isPlainObjectFilter(value) ? value : { _id: value }))
        );
      });
      return;
    }
    if (operator === "$pullAll") {
      Object.entries(payload).forEach(([path, values]) => {
        const list = getPath(doc, path);
        if (!Array.isArray(list)) return;
        setPath(
          doc,
          path,
          list.filter((entry) => !(values || []).some((value) => String(value) === String(entry)))
        );
      });
    }
  });

  return doc;
};

const touch = (doc, model) => {
  const timestamps = timestampFields(model.schema);
  if (timestamps && timestamps.updatedAt) doc[timestamps.updatedAt] = new Date();
};

const writeResult = (matched, modified, upsertedId) => ({
  acknowledged: true,
  matchedCount: matched,
  modifiedCount: modified,
  upsertedCount: upsertedId ? 1 : 0,
  upsertedId: upsertedId || null,
});

/* ------------------------------------------------------------------ *
 * Model factory
 * ------------------------------------------------------------------ */

const createModel = (modelName, schema, registry) => {
  patchSchemaHooks();
  schema.modelName = modelName;

  class MemoryModel extends MemoryDocument {
    static modelName = modelName;

    static schema = schema;

    static registry = registry;

    static docs = [];

    constructor(input, options) {
      super(MemoryModel, input, options);
    }

    /* ---------------- reads ---------------- */

    static find(filter = {}, ...rest) {
      return new MemoryQuery(this, { filter }).setOptions(rest[0] || {});
    }

    static findOne(filter = {}, ...rest) {
      return new MemoryQuery(this, { filter, single: true }).setOptions(rest[0] || {});
    }

    static findById(id, ...rest) {
      return new MemoryQuery(this, { filter: { _id: id }, single: true }).setOptions(rest[0] || {});
    }

    static findByIdOrNull(id, ...rest) {
      return MemoryModel.findById(id, ...rest);
    }

    static async countDocuments(filter = {}) {
      return this.docs.filter((doc) => matchesFilter(doc, filter)).length;
    }

    static async estimatedDocumentCount() {
      return this.docs.length;
    }

    static async distinct(field, filter = {}) {
      const docs = this.docs.filter((doc) => matchesFilter(doc, filter));
      return distinctValues(docs, field);
    }

    static async exists(filter = {}) {
      const doc = this.docs.find((candidate) => matchesFilter(candidate, filter));
      return doc ? { _id: doc._id } : null;
    }

    static async aggregate(pipeline = []) {
      return runPipeline(this.docs.map((doc) => doc.toObject({ virtuals: false })), pipeline, registry).map(
        (row) => cloneValue(row)
      );
    }

    /* ---------------- writes ---------------- */

    static async create(input) {
      if (Array.isArray(input)) {
        const created = [];
        for (const entry of input) created.push(await MemoryModel.create(entry));
        return created;
      }
      const doc = new MemoryModel(input);
      await doc.save();
      return doc;
    }

    static async insertMany(entries = [], options = {}) {
      const list = Array.isArray(entries) ? entries : [entries];
      const created = [];

      for (const entry of list) {
        const doc = new MemoryModel(entry);
        // `insertMany` does not run `pre("save")` hooks, matching Mongoose.
        validateDoc(doc, schema);
        const timestamps = timestampFields(schema);
        if (timestamps && timestamps.updatedAt) doc[timestamps.updatedAt] = new Date();
        assertUnique(doc, schema, this.docs);
        if (options.ordered === false) {
          try {
            assertUnique(doc, schema, this.docs);
          } catch {
            continue;
          }
        }
        this.docs.push(doc);
        doc.$__setInternal({ isNew: false, snapshot: doc.toObject({ virtuals: false }) });
        created.push(doc);
      }

      return created;
    }

    static async updateOne(filter, update, options = {}) {
      const doc = this.docs.find((candidate) => matchesFilter(candidate, filter));

      if (!doc) {
        if (!options.upsert) return writeResult(0, 0);
        const seed = cloneValue(isPlainObjectFilter(filter) ? filter : {});
        Object.keys(seed).forEach((key) => {
          if (key === "$or" || key === "$and") delete seed[key];
        });
        Object.assign(seed, cloneValue((update && update.$set) || {}));
        const created = new MemoryModel(seed);
        applyUpdate(created, update, { isInsert: true });
        const timestamps = timestampFields(schema);
        if (timestamps && timestamps.createdAt && !created[timestamps.createdAt]) {
          created[timestamps.createdAt] = new Date();
        }
        await created.save();
        return writeResult(0, 0, created._id);
      }

      const before = doc.toObject({ virtuals: false });
      applyUpdate(doc, update);
      touch(doc, this);
      const after = doc.toObject({ virtuals: false });
      doc.$__setInternal({ snapshot: after });

      return writeResult(1, JSON.stringify(before) === JSON.stringify(after) ? 0 : 1);
    }

    static async updateMany(filter, update, options = {}) {
      const matches = this.docs.filter((doc) => matchesFilter(doc, filter));
      if (!matches.length && options.upsert) return MemoryModel.updateOne(filter, update, options);

      let modified = 0;
      matches.forEach((doc) => {
        const before = doc.toObject({ virtuals: false });
        applyUpdate(doc, update);
        touch(doc, MemoryModel);
        if (JSON.stringify(before) !== JSON.stringify(doc.toObject({ virtuals: false }))) {
          modified += 1;
        }
        doc.$__setInternal({ snapshot: doc.toObject({ virtuals: false }) });
      });

      return writeResult(matches.length, modified);
    }

    static async replaceOne(filter, replacement) {
      const doc = this.docs.find((candidate) => matchesFilter(candidate, filter));
      if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      Object.keys(doc).forEach((key) => {
        if (key !== "_id") delete doc[key];
      });
      Object.assign(doc, buildFromSchema(schema, replacement));
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    }

    static async findOneAndUpdate(filter, update, options = {}) {
      const doc = this.docs.find((candidate) => matchesFilter(candidate, filter));
      if (!doc) {
        if (options.upsert) await MemoryModel.updateOne(filter, update, options);
        return null;
      }
      const before = doc.toObject({ virtuals: false });
      applyUpdate(doc, update, { isInsert: Boolean(options.upsert) });
      touch(doc, this);
      const after = doc.toObject({ virtuals: false });
      doc.$__setInternal({ snapshot: after });
      return options.new === true || options.returnDocument === "after" ? doc : cloneValue(before);
    }

    static async findOneAndDelete(filter) {
      const index = this.docs.findIndex((candidate) => matchesFilter(candidate, filter));
      if (index < 0) return null;
      const [doc] = this.docs.splice(index, 1);
      return doc;
    }

    static async deleteOne(filter) {
      const index = this.docs.findIndex((candidate) => matchesFilter(candidate, filter));
      if (index < 0) return { acknowledged: true, deletedCount: 0 };
      this.docs.splice(index, 1);
      return { acknowledged: true, deletedCount: 1 };
    }

    static async deleteMany(filter = {}) {
      const keep = [];
      let deleted = 0;
      this.docs.forEach((doc) => {
        if (matchesFilter(doc, filter)) deleted += 1;
        else keep.push(doc);
      });
      this.docs.length = 0;
      keep.forEach((doc) => this.docs.push(doc));
      return { acknowledged: true, deletedCount: deleted };
    }

    static async bulkWrite(operations = []) {
      let modified = 0;
      for (const operation of operations) {
        const [action] = Object.keys(operation);
        const { filter = {}, update = {}, insertOne } = operation[action];
        if (action === "deleteOne") {
          await MemoryModel.deleteOne(filter);
          modified += 1;
        } else if (insertOne) {
          await MemoryModel.create(insertOne.document);
          modified += 1;
        } else {
          await MemoryModel.updateMany(filter, update);
          modified += 1;
        }
      }
      return { acknowledged: true, modifiedCount: modified };
    }

    static hydrate(input) {
      return new MemoryModel(input, { isNew: false });
    }

    static getCollection() {
      return this.docs;
    }
  }

  const collectionName = schema.options.collection || mongoose.pluralize()(modelName.toLowerCase());
  MemoryModel.collection = { name: collectionName };
  Object.entries(schema.statics || {}).forEach(([name, fn]) => {
    MemoryModel[name] = fn;
  });
  Object.entries(schema.methods || {}).forEach(([name, fn]) => {
    // Mongoose injects its own plumbing (`initializeTimestamps`); only the
    // schema's own instance methods belong on the prototype.
    if (name.startsWith("_") || name.startsWith("initialize")) return;
    MemoryModel.prototype[name] = fn;
  });

  // Registry entries are keyed by both model name and collection name so that
  // aggregation `$lookup: { from: "categories" }` resolves the way it does in
  // MongoDB, where `from` is always a collection name.
  MemoryModel.modelName = modelName;

  // Mirror Mongoose so `mongoose.models.X` lookups resolve in memory mode too.
  mongoose.models[modelName] = MemoryModel;

  registry.set(modelName, MemoryModel);
  if (collectionName !== modelName) registry.set(collectionName, MemoryModel);
  return MemoryModel;
};

module.exports = { MemoryQuery, createModel, ObjectId };