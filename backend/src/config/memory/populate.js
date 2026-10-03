"use strict";

/**
 * `populate()` support: resolve `ref` paths against other in-memory
 * collections, including nested (`items.store`) and array references
 * (`categories`, `wishlist`, `favoriteStores`).
 */

const { getPath, isPlainObject, unsetPath } = require("./support");
const { matchesFilter } = require("./match");
const { normalizeSelect, projectDoc } = require("./projection");

const splitPath = (path) => {
  const segments = path.split(".");
  return { parent: segments.slice(0, -1).join("."), key: segments[segments.length - 1] };
};

/** Walk a definition looking for a `ref`, covering `ref`, `caster` and array shorthand. */
const refFrom = (node, depth = 0) => {
  if (!node || depth > 3) return null;
  if (typeof node === "string") return null;
  if (typeof node === "function") return null;
  if (node.options && typeof node.options.ref === "string") return node.options.ref;
  if (typeof node.ref === "string") return node.ref;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = refFrom(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (node.caster) {
    const found = refFrom(node.caster, depth + 1);
    if (found) return found;
  }
  if (node.options && node.options.type) {
    const found = refFrom(node.options.type, depth + 1);
    if (found) return found;
  }
  if (node.type) {
    const found = refFrom(node.type, depth + 1);
    if (found) return found;
  }
  if (node.schema) return refFrom(node.schema, depth + 1);
  return null;
};

/** Find the `ref` model name for a path such as `category`, `wishlist` or `items.store`. */
const refFor = (schema, path) => {
  const subpath = (schema.subpaths || {})[path];
  if (subpath) {
    const found = refFrom(subpath);
    if (found) return found;
  }

  const definition = schema.path(path);
  if (definition) {
    const found = refFrom(definition);
    if (found) return found;
  }

  const { parent, key } = splitPath(path);
  if (parent) {
    const parentPath = schema.path(parent);
    const nested = parentPath && parentPath.schema && parentPath.schema.path(key);
    const found = refFrom(nested);
    if (found) return found;
  }

  return null;
};

/**
 * Normalise `populate(path)`, `populate(path, select)`, `populate(path,
 * select, options)` and object forms. Mongoose takes `select` positionally,
 * so string arguments are consumed in pairs.
 */
const normalizePopulate = (args) => {
  const entries = [];
  const flat = args.flat();

  for (let i = 0; i < flat.length; i += 1) {
    const arg = flat[i];

    if (typeof arg === "string") {
      const next = flat[i + 1];
      if (typeof next === "string") {
        entries.push({ path: arg, select: next, match: null, populate: [] });
        i += 1;
      } else {
        entries.push({ path: arg, select: null, match: null, populate: [] });
      }
      continue;
    }

    if (!isPlainObject(arg)) continue;

    const select =
      arg.select && typeof arg.select === "object" && !Array.isArray(arg.select)
        ? arg.select
        : arg.select || null;

    if (Array.isArray(arg.path)) {
      arg.path.forEach((path) =>
        entries.push({ path, select: select || null, match: arg.match || null, populate: arg.populate || [] })
      );
      continue;
    }
    entries.push({
      path: arg.path,
      select: select || null,
      match: arg.match || null,
      populate: arg.populate || [],
    });
  }

  return entries.filter((entry) => entry && entry.path);
};

const selectFields = (select) => {
  if (!select) return [];
  if (typeof select === "string") return select.split(/\s+/).filter(Boolean);
  if (Array.isArray(select)) return select.flatMap((entry) => selectFields(entry));
  if (isPlainObject(select)) {
    return Object.entries(select)
      .filter(([, value]) => Boolean(value))
      .map(([field]) => field);
  }
  return [];
};

/**
 * Populate one path across `docs`. Mutates the documents in place, the same
 * way Mongoose does before projection is applied. Nested `populate` calls are
 * resolved against plain snapshots so the stored documents are never touched.
 */
const populatePath = (docs, entry, schema, registry) => {
  const ref = refFor(schema, entry.path);
  if (!ref) return;

  const target = registry.get(ref);
  if (!target) return;

  const { parent, key } = splitPath(entry.path);
  const fields = selectFields(entry.select);
  const projection = fields.length ? normalizeSelect(fields, target.schema) : null;
  const selectedPaths = new Set(fields);
  const nested = normalizePopulate(entry.populate || []);

  const shape = (doc) => {
    if (!doc) return doc;
    if (projection) return projectDoc(doc, projection);
    if (!selectedPaths.size) return doc;
    const out = {};
    if (doc._id !== undefined) out._id = doc._id;
    for (const field of selectedPaths) out[field] = getPath(doc, field);
    return out;
  };

  // Resolve one reference value into its populated form.
  const resolve = (value) => {
    const isArrayRef = Array.isArray(value);
    const ids = (isArrayRef ? value : [value]).map((id) =>
      id && typeof id === "object" && "_id" in id ? id._id : id
    );

    let matches = target.docs.filter((candidate) => ids.some((id) => sameId(candidate._id, id)));

    if (entry.match) matches = matches.filter((candidate) => matchesFilter(candidate, entry.match));

    const shaped = matches.map((match) => {
      if (!nested.length) return shape(match);
      const plain = match.toObject({ virtuals: false });
      nested.forEach((child) => populatePath([plain], child, target.schema, registry));
      return shape(plain);
    });

    if (isArrayRef) return shaped;
    return shaped.length ? shaped[0] : null;
  };

  docs.forEach((doc) => {
    const container = parent ? getPath(doc, parent) : doc;
    if (!container) return;

    const holder = Array.isArray(container) ? container : [container];
    holder.forEach((entryDoc) => {
      if (!entryDoc || typeof entryDoc !== "object") return;
      const value = entryDoc[key];

      if (value === undefined || value === null) {
        if (Array.isArray(container)) return;
        entryDoc[key] = null;
        return;
      }

      const resolved = resolve(value);
      if (Array.isArray(value)) {
        entryDoc[key] = resolved;
        return;
      }
      if (resolved) entryDoc[key] = resolved;
      else unsetPath(entryDoc, key);
    });
  });
};

const sameId = (a, b) => {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
};

const populateDocs = (docs, populateArgs, schema, registry) => {
  normalizePopulate(populateArgs).forEach((entry) => {
    populatePath(docs, entry, schema, registry);
  });
  return docs;
};

module.exports = { populateDocs, normalizePopulate, refFor, splitPath, matchesFilter };