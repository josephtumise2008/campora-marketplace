"use strict";

/**
 * In-memory document: schema-driven defaults, timestamps, validation,
 * unique indexes, virtuals, `toObject`/`toJSON` transforms and `save()`.
 *
 * Documents are stored in the collection as live instances, so the mutation
 * pattern the controllers already use — mutate fields, then `await
 * doc.save()` — behaves exactly as it does with Mongoose.
 */

const mongoose = require("mongoose");

const {
  cloneValue,
  getPath,
  isObjectId,
  isPlainObject,
  looseEq,
  setPath,
} = require("./support");

const ObjectId = mongoose.Types.ObjectId;

const META_KEYS = new Set(["_id", "__v", "id", "createdAt", "updatedAt"]);

/* ------------------------------------------------------------------ *
 * Hooks captured from `schema.pre(...)`
 * ------------------------------------------------------------------ */

const hookRegistry = new WeakMap();

const captureHooks = (schema) => {
  if (!hookRegistry.has(schema)) hookRegistry.set(schema, { pres: new Map(), posts: new Map() });
  return hookRegistry.get(schema);
};

const recordHook = (schema, kind, name, fn) => {
  const store = captureHooks(schema);
  const key = String(name);
  if (!store[kind].has(key)) store[kind].set(key, []);
  store[kind].get(key).push(fn);
};

/** Install a capture layer over `Schema.prototype.pre/post`. */
const patchSchemaHooks = () => {
  if (mongoose.Schema.prototype.__camporaHookPatch) return;
  const originalPre = mongoose.Schema.prototype.pre;
  const originalPost = mongoose.Schema.prototype.post;

  mongoose.Schema.prototype.pre = function pre(nameOrFn, maybeFn) {
    const name = typeof nameOrFn === "function" ? null : nameOrFn;
    const fn = typeof nameOrFn === "function" ? nameOrFn : maybeFn;
    if (typeof fn === "function" && name) recordHook(this, "pres", name, fn);
    return originalPre.apply(this, arguments);
  };

  mongoose.Schema.prototype.post = function post(nameOrFn, maybeFn) {
    const name = typeof nameOrFn === "function" ? null : nameOrFn;
    const fn = typeof nameOrFn === "function" ? nameOrFn : maybeFn;
    if (typeof fn === "function" && name) recordHook(this, "posts", name, fn);
    return originalPost.apply(this, arguments);
  };

  mongoose.Schema.prototype.__camporaHookPatch = true;
};

/**
 * Mongoose installs its own pre-hooks (`timestampsPreSave`,
 * `_setTimestampsOnUpdate`, …) that expect a real Mongoose document. The
 * in-memory database handles timestamps itself, so only application hooks run.
 */
const isInternalHook = (fn) => {
  const name = fn && fn.name ? fn.name : "";
  return name.startsWith("_") || name.startsWith("timestamps");
};

const runHooks = async (schema, name, doc) => {
  const store = hookRegistry.get(schema);
  const hooks = store && store.pres.get(name);
  if (!hooks || !hooks.length) return;
  for (const hook of hooks) {
    if (isInternalHook(hook)) continue;
    await hook.call(doc);
  }
};

/* ------------------------------------------------------------------ *
 * Defaults
 * ------------------------------------------------------------------ */

const timestampFields = (schema) => {
  const setting = schema.options.timestamps;
  if (!setting) return null;
  if (setting === true) return { createdAt: "createdAt", updatedAt: "updatedAt" };
  return {
    createdAt: setting.createdAt || "createdAt",
    updatedAt: setting.updatedAt || "updatedAt",
  };
};

const applyTreeDefaults = (tree, input, schema) => {
  const out = {};
  const source = isPlainObject(input) ? input : {};

  Object.entries(tree || {}).forEach(([key, rawDef]) => {
    if (META_KEYS.has(key)) return;
    out[key] = resolveField(rawDef, source[key]);
  });

  void schema;
  return out;
};

const resolveField = (rawDef, value) => {
  // Shorthand array syntax, e.g. `wishlist: [{ type: ObjectId, ref: "Product" }]`.
  if (Array.isArray(rawDef)) {
    const list = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    if (list.length === 0) return [];
    const element = rawDef[0];
    const elementSub = element instanceof mongoose.Schema ? element : null;
    const elementTree = isPlainObject(element) ? element : null;
    return list.map((entry) => {
      if (elementSub) return buildFromSchema(elementSub, entry);
      if (elementTree) return applyTreeDefaults(elementTree, entry);
      return entry;
    });
  }

  const isDefinition =
    isPlainObject(rawDef) && "type" in rawDef && !Array.isArray(rawDef) && !(rawDef instanceof Date);

  if (!isDefinition) {
    if (isPlainObject(rawDef)) return applyTreeDefaults(rawDef, value);
    return value;
  }

  const type = rawDef.type;
  const singleSub = type instanceof mongoose.Schema ? type : null;
  const arrayElement =
    Array.isArray(type) && type[0] && typeof type[0] === "object" && !(type[0] instanceof mongoose.Schema)
      ? type[0]
      : null;
  const arraySub = Array.isArray(type) && type[0] instanceof mongoose.Schema ? type[0] : null;

  if (Array.isArray(value)) {
    if (arraySub) return value.map((entry) => buildFromSchema(arraySub, entry));
    if (arrayElement) return value.map((entry) => applyTreeDefaults(arrayElement, entry));
    return value;
  }

  if (value !== undefined && value !== null) {
    if (singleSub && isPlainObject(value)) return buildFromSchema(singleSub, value);
    return value;
  }

  if ("default" in rawDef) {
    let fallback = rawDef.default;
    if (typeof fallback === "function") fallback = fallback();
    if (Array.isArray(fallback)) {
      if (arraySub) return fallback.map((entry) => buildFromSchema(arraySub, entry));
      if (arrayElement) return fallback.map((entry) => applyTreeDefaults(arrayElement, entry));
      return fallback;
    }
    if (singleSub) return buildFromSchema(singleSub, fallback === undefined ? {} : fallback);
    if (isPlainObject(fallback)) return applyTreeDefaults(fallback, fallback);
    return fallback;
  }

  if (arraySub || Array.isArray(type)) return [];
  if (singleSub) return buildFromSchema(singleSub, {});
  if (isPlainObject(type)) return applyTreeDefaults(type, {});
  return undefined;
};

const buildFromSchema = (schema, input) => {
  const out = applyTreeDefaults(schema.tree, input, schema);
  if (schema.options._id !== false && !out._id) out._id = new ObjectId();
  return out;
};

/* ------------------------------------------------------------------ *
 * Casting / normalisation
 * ------------------------------------------------------------------ */

/** Apply `trim`, `lowercase`, `uppercase` and numeric casting. */
const applySetters = (doc, schema) => {
  Object.entries(schema.paths || {}).forEach(([path, definition]) => {
    if (META_KEYS.has(path)) return;
    const options = definition.options || {};
    const instance = definition.instance;
    const value = getPath(doc, path);

    if (typeof value === "string") {
      let next = value;
      if (options.trim) next = next.trim();
      if (options.lowercase) next = next.toLowerCase();
      if (options.uppercase) next = next.toUpperCase();
      if (next !== value) setPath(doc, path, next);
      return;
    }

    if (value === undefined || value === null) return;

    if (instance === "Number" && typeof value === "string" && value.trim() !== "") {
      setPath(doc, path, Number(value));
      return;
    }
    if (instance === "Boolean" && typeof value === "string") {
      setPath(doc, path, value === "true" || value === "1");
      return;
    }
    if (definition.options && definition.options.type === ObjectId) {
      if (typeof value === "string" && ObjectId.isValid(value)) {
        setPath(doc, path, new ObjectId(value));
      }
    }
  });
};

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

const validationError = (errors) => {
  const error = new Error("Validation failed");
  error.name = "ValidationError";
  error.errors = errors;
  return error;
};

const validateDoc = (doc, schema) => {
  const errors = {};

  Object.entries(schema.paths || {}).forEach(([path, definition]) => {
    if (META_KEYS.has(path)) return;
    const value = getPath(doc, path);
    const options = definition.options || {};
    const empty = value === undefined || value === null || value === "";

    if (options.required && empty) {
      const message = Array.isArray(options.required)
        ? options.required[1]
        : `${path} is required`;
      errors[path] = { message, kind: "required", path };
      return;
    }

    if (empty) return;

    const values = Array.isArray(definition.enumValues) && definition.enumValues.length
      ? definition.enumValues
      : null;
    if (values) {
      const list = Array.isArray(value) ? value : [value];
      const invalid = list.find((entry) => !values.some((allowed) => looseEq(allowed, entry)));
      if (invalid !== undefined) {
        errors[path] = {
          message: `${invalid} is not a valid value for ${path}`,
          kind: "enum",
          path,
          value: invalid,
        };
        return;
      }
    }

    if (typeof value === "number") {
      if (typeof options.min === "number" && value < options.min) {
        errors[path] = { message: `${path} must be at least ${options.min}`, kind: "min", path };
        return;
      }
      if (typeof options.max === "number" && value > options.max) {
        errors[path] = { message: `${path} must be at most ${options.max}`, kind: "max", path };
      }
    }
  });

  if (Object.keys(errors).length) throw validationError(errors);
};

/* ------------------------------------------------------------------ *
 * Unique indexes
 * ------------------------------------------------------------------ */

const uniqueIndexes = (schema) => {
  const indexes = [];
  Object.entries(schema.paths || {}).forEach(([path, definition]) => {
    if (definition.options && definition.options.unique === true) indexes.push([path]);
  });
  (schema.indexes ? schema.indexes() : []).forEach((entry) => {
    const [keys, options] = entry;
    if (options && options.unique) indexes.push(Object.keys(keys));
  });
  return indexes;
};

const assertUnique = (doc, schema, docs, self) => {
  uniqueIndexes(schema).forEach((fields) => {
    const values = fields.map((field) => getPath(doc, field));
    if (values.some((value) => value === undefined || value === null)) return;

    const clash = docs.find(
      (candidate) =>
        candidate !== self &&
        fields.every((field, index) => looseEq(getPath(candidate, field), values[index]))
    );

    if (clash) {
      const error = new Error(
        `E11000 duplicate key error collection: campora.${schema.modelName.toLowerCase()} index: ${fields.join("_1")}`
      );
      error.code = 11000;
      error.keyPattern = fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {});
      error.keyValue = fields.reduce((acc, field, index) => ({ ...acc, [field]: values[index] }), {});
      throw error;
    }
  });
};

/* ------------------------------------------------------------------ *
 * Document
 * ------------------------------------------------------------------ */

const INTERNAL = Symbol("campora.memoryDocument");

class MemoryDocument {
  constructor(model, input = {}, { isNew = true } = {}) {
    const schema = this.constructor.schema;
    Object.assign(this, buildFromSchema(schema, input));

    const timestamps = timestampFields(schema);
    const now = new Date();
    if (timestamps) {
      if (!this[timestamps.createdAt]) this[timestamps.createdAt] = now;
      this[timestamps.updatedAt] = now;
    }

    applySetters(this, schema);

    Object.defineProperty(this, INTERNAL, {
      value: {
        model,
        isNew,
        snapshot: this.toObject({ virtuals: false, skipTimestamps: true }),
      },
      enumerable: false,
      writable: true,
      configurable: true,
    });

    if (!Object.prototype.hasOwnProperty.call(this, "id") || this.id === undefined) {
      Object.defineProperty(this, "id", {
        get() {
          return this._id ? this._id.toString() : undefined;
        },
        enumerable: false,
        configurable: true,
      });
    }
  }

  get $isNew() {
    return this[INTERNAL].isNew;
  }

  $__setInternal(patch) {
    Object.assign(this[INTERNAL], patch);
  }

  /**
   * Field-level change tracking, compared against the snapshot taken when the
   * document was loaded or last saved. A document that has never been saved
   * has every assigned path marked as modified, matching Mongoose.
   */
  isModified(path) {
    const snapshot = this[INTERNAL].snapshot || {};
    if (!path) return JSON.stringify(this.toObject({ virtuals: false })) !== JSON.stringify(snapshot);
    if (this[INTERNAL].isNew) return getPath(this, path) !== undefined;
    const current = getPath(this, path);
    const previous = getPath(snapshot, path);
    if (looseEq(current, previous)) return false;
    return String(current) !== String(previous);
  }

  set(path, value) {
    if (typeof path === "object" && path !== null) {
      Object.entries(path).forEach(([key, entry]) => this.set(key, entry));
      return this;
    }
    setPath(this, path, value);
    return this;
  }

  get(path) {
    return getPath(this, path);
  }

  markModified() {
    return this;
  }

  toObject(options = {}) {
    const plain = {};
    Object.keys(this).forEach((key) => {
      plain[key] = cloneValue(this[key]);
    });

    const schemaOptions = this.constructor.schema.options || {};
    const toObjectOptions = { ...(schemaOptions.toObject || {}), ...options };

    if (toObjectOptions.virtuals) this.applyVirtuals(plain);

    const transform = toObjectOptions.transform;
    if (typeof transform === "function") {
      return transform(this, plain, toObjectOptions);
    }
    return plain;
  }

  toJSON(options = {}) {
    const schemaOptions = this.constructor.schema.options || {};
    const jsonOptions = {
      ...(schemaOptions.toJSON || {}),
      virtuals: schemaOptions.toJSON ? schemaOptions.toJSON.virtuals !== false : true,
      ...options,
    };
    return this.toObject(jsonOptions);
  }

  applyVirtuals(target) {
    const schema = this.constructor.schema;
    const virtuals = schema.virtuals || {};

    Object.keys(virtuals).forEach((name) => {
      if (name === "id") return;
      const definition = virtuals[name];
      const getter = definition && typeof definition.get === "function" ? definition.get : null;
      if (!getter) return;
      try {
        const value = getter.call(this);
        if (value !== undefined) target[name] = cloneValue(value);
      } catch {
        /* virtuals must never break serialisation */
      }
    });
  }

  async save() {
    const { model, isNew } = this[INTERNAL];
    const schema = model.schema;

    await runHooks(schema, "save", this);

    applySetters(this, schema);
    validateDoc(this, schema);

    const timestamps = timestampFields(schema);
    if (timestamps && timestamps.createdAt && !this[timestamps.createdAt]) {
      this[timestamps.createdAt] = new Date();
    }
    if (timestamps && timestamps.updatedAt) this[timestamps.updatedAt] = new Date();

    const index = model.docs.findIndex((doc) => String(doc._id) === String(this._id));
    assertUnique(this, schema, model.docs, isNew ? undefined : this);

    // Persist by id so hydrated copies (for example a populated clone) save
    // into the slot their id belongs to.
    if (index >= 0) model.docs[index] = this;
    else model.docs.push(this);
    this[INTERNAL].isNew = false;
    this[INTERNAL].snapshot = this.toObject({ virtuals: false });
    return this;
  }

  async deleteOne() {
    const { model } = this[INTERNAL];
    const index = model.docs.findIndex((doc) => String(doc._id) === String(this._id));
    if (index >= 0) model.docs.splice(index, 1);
    return { acknowledged: true, deletedCount: index >= 0 ? 1 : 0 };
  }

  remove() {
    return this.deleteOne();
  }
}

/** Attach schema virtuals and instance methods to the document class. */
const decorateDocument = (MemoryModel) => {
  const { schema } = MemoryModel;

  Object.entries(schema.methods || {}).forEach(([name, fn]) => {
    MemoryModel.prototype[name] = fn;
  });
};

/**
 * Copy a document so populate can write over its reference paths without
 * touching the stored instance. The clone shares the internal state, so
 * `save()` on the clone still persists to the same collection slot.
 */
const cloneDocument = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const clone = Object.create(Object.getPrototypeOf(doc));
  Object.assign(clone, doc);
  Object.defineProperty(clone, INTERNAL, {
    value: doc[INTERNAL],
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return clone;
};

module.exports = {
  MemoryDocument,
  cloneDocument,
  applySetters,
  assertUnique,
  buildFromSchema,
  decorateDocument,
  patchSchemaHooks,
  runHooks,
  timestampFields,
  uniqueIndexes,
  validateDoc,
  validationError,
};