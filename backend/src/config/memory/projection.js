"use strict";

/**
 * Sorting and field projection for the in-memory query engine.
 */

const { cloneValue, compareValues, getPath, isPlainObject, unsetPath } = require("./support");
const { equalsValue } = require("./match");

/* ------------------------------------------------------------------ *
 * Sorting
 * ------------------------------------------------------------------ */

/** Accepts `"-soldCount"` style strings or `{ "rating.average": -1 }`. */
const normalizeSort = (sort) => {
  if (!sort) return [];
  if (typeof sort === "string") {
    return sort
      .split(/\s+/)
      .filter(Boolean)
      .map((field) => [field.replace(/^-/, ""), field.startsWith("-") ? -1 : 1]);
  }
  if (Array.isArray(sort)) {
    return sort.flatMap((entry) =>
      Object.entries(entry).map(([field, direction]) => [field, direction < 0 ? -1 : 1])
    );
  }
  if (isPlainObject(sort)) {
    return Object.entries(sort).map(([field, direction]) => [field, Number(direction) < 0 ? -1 : 1]);
  }
  return [];
};

const sortDocs = (docs, sort) => {
  const criteria = normalizeSort(sort);
  if (!criteria.length) return docs;

  return docs.slice().sort((a, b) => {
    for (const [field, direction] of criteria) {
      const left = getPath(a, field);
      const right = getPath(b, field);
      const result = compareValues(left, right);
      if (result !== 0) return result * direction;
    }
    return 0;
  });
};

/* ------------------------------------------------------------------ *
 * Projection
 * ------------------------------------------------------------------ */

/** Fields excluded unless explicitly asked for (schema `select: false`). */
const selectFalsePaths = (schema) => {
  const paths = [];
  for (const [path, definition] of Object.entries(schema.paths || {})) {
    if (definition && definition.options && definition.options.select === false) {
      paths.push(path);
    }
  }
  return paths;
};

/**
 * Turn `.select()` arguments into `{ mode, fields }`.
 *
 * Mongoose semantics: a bare field name in a string argument *includes* it,
 * `-field` excludes it, `+field` forces inclusion of a `select: false` path,
 * and object form (`{ field: 1 }` / `{ field: 0 }`) states the intent
 * explicitly. `mode` becomes `include` as soon as any field is included.
 */
const normalizeSelect = (selectArgs, schema) => {
  let mode = "exclude";
  const excluded = new Set(selectFalsePaths(schema));
  const included = new Set(["_id"]);

  const include = (path) => {
    const name = path.replace(/^\+/, "");
    if (!name) return;
    excluded.delete(name);
    included.add(name);
    mode = "include";
  };
  const exclude = (path) => {
    const name = path.replace(/^-/, "");
    if (!name) return;
    included.delete(name);
    excluded.add(name);
  };

  for (const arg of selectArgs.flat()) {
    if (!arg) continue;

    if (isPlainObject(arg)) {
      for (const [path, value] of Object.entries(arg)) {
        if (value === 0 || value === false) exclude(path);
        else include(path);
      }
      continue;
    }

    String(arg)
      .split(/\s+/)
      .filter(Boolean)
      .forEach((path) => {
        if (path.startsWith("-")) exclude(path);
        else include(path);
      });
  }

  if (mode === "include") {
    excluded.delete("_id");
    return { mode, fields: included };
  }

  excluded.delete("_id");
  return { mode, fields: excluded };
};

const copyPath = (source, target, path) => {
  const value = getPath(source, path);
  if (value === undefined) return;
  const segments = path.split(".");
  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (current[segment] === undefined || current[segment] === null) {
      current[segment] = Array.isArray(getPath(source, segments.slice(0, i + 2).join(".")))
        ? []
        : {};
    }
    current = current[segment];
  }
  current[segments[segments.length - 1]] = cloneValue(value);
};

/**
 * Apply a projection to a plain document. Returns a new object; the stored
 * document is never mutated.
 */
const projectDoc = (doc, projection) => {
  const source = doc && typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : doc;
  const { mode, fields } = projection;

  if (mode === "include") {
    const out = {};
    if (getPath(source, "_id") !== undefined) out._id = cloneValue(source._id);
    for (const path of fields) {
      if (path === "_id") {
        out._id = cloneValue(source._id);
        continue;
      }
      copyPath(source, out, path);
    }
    return out;
  }

  const out = cloneValue(source);
  for (const path of fields) {
    if (path === "_id") {
      delete out._id;
      continue;
    }
    if (out[path] !== undefined) unsetPath(out, path);
    else {
      // Dotted exclusions inside nested arrays, e.g. `items.store`.
      const segments = path.split(".");
      const parent = getPath(out, segments.slice(0, -1).join("."));
      if (Array.isArray(parent)) {
        const leaf = segments[segments.length - 1];
        parent.forEach((entry) => {
          if (entry && typeof entry === "object") delete entry[leaf];
        });
      }
    }
  }
  return out;
};

/** Distinct values for `field` — used by `Model.distinct()`. */
const distinctValues = (docs, field) => {
  const seen = [];
  for (const doc of docs) {
    const value = getPath(doc, field);
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry === undefined) continue;
      if (!seen.some((existing) => equalsValue(existing, entry))) seen.push(entry);
    }
  }
  return seen;
};

module.exports = { distinctValues, normalizeSelect, normalizeSort, projectDoc, sortDocs };