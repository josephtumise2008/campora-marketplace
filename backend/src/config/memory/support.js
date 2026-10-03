"use strict";

/**
 * Value helpers shared by the in-memory query engine.
 *
 * The goal is Mongo-like semantics for the small subset of behaviour the
 * Campora controllers actually rely on: ObjectId comparisons that tolerate
 * strings, regex matching across array fields, dotted paths, and a stable
 * value ordering for sorting.
 */

const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

const isObjectId = (value) => value instanceof ObjectId;

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !(value instanceof RegExp) &&
  !isObjectId(value);

const isOperatorExpression = (value) =>
  isPlainObject(value) && Object.keys(value).some((key) => key.startsWith("$"));

/**
 * Equality that tolerates the type drift real Mongo drivers absorb: an
 * ObjectId in storage versus a hex string in a controller filter.
 */
const looseEq = (a, b) => {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) {
    return (a === null && b === null) || (a === undefined && b === undefined);
  }
  if (isObjectId(a) || isObjectId(b)) {
    const left = isObjectId(a) ? a.toString() : String(a);
    const right = isObjectId(b) ? b.toString() : String(b);
    return ObjectId.isValid(left) && left === right;
  }
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date && typeof b === "string") return a.toISOString() === b;
  if (typeof a === "number" && typeof b === "string") return b.trim() !== "" && a === Number(b);
  if (typeof b === "number" && typeof a === "string") return looseEq(b, a);
  return false;
};

/** Read a dotted path. Supports `items.0.store` and array traversal. */
const getPath = (target, path) => {
  if (!target || typeof path !== "string") return undefined;
  if (Object.prototype.hasOwnProperty.call(target, path) && !path.includes(".")) {
    return target[path];
  }
  let current = target;
  for (const segment of path.split(".")) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      if (/^\d+$/.test(segment)) {
        current = current[Number(segment)];
        continue;
      }
      const mapped = current.map((entry) => getPath(entry, segment));
      return mapped.some((entry) => entry !== undefined) ? mapped : undefined;
    }
    if (typeof current !== "object") return undefined;
    current = current[segment];
  }
  return current;
};

/** Write a dotted path, creating intermediate objects as needed. */
const setPath = (target, path, value) => {
  const segments = path.split(".");
  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    if (current[segment] === undefined || current[segment] === null) {
      current[segment] = /^\d+$/.test(nextSegment) ? [] : {};
    }
    current = Array.isArray(current) ? current[Number(segment)] : current[segment];
  }
  current[segments[segments.length - 1]] = value;
  return target;
};

const unsetPath = (target, path) => {
  const segments = path.split(".");
  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (current === null || current === undefined) return target;
    current = Array.isArray(current) ? current[Number(segment)] : current[segment];
  }
  if (!current || typeof current !== "object") return target;
  const last = segments[segments.length - 1];
  if (Array.isArray(current)) current.splice(Number(last), 1);
  else delete current[last];
  return target;
};

/** Deep clone plain data. Dates, ObjectIds and RegExps are copied as-is. */
const cloneValue = (value) => {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return value;
  if (isObjectId(value)) return value;
  if (value && typeof value === "object" && typeof value.toObject === "function") {
    return value.toObject({ virtuals: false });
  }
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, entry] of Object.entries(value)) out[key] = cloneValue(entry);
    return out;
  }
  return value;
};

const typeRank = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number" || typeof value === "boolean") return 1;
  if (typeof value === "string") return 2;
  if (value instanceof Date || isObjectId(value)) return 3;
  if (Array.isArray(value)) return 4;
  return 5;
};

/** Mongo-ish total ordering: numbers < strings < dates < arrays. */
const compareValues = (a, b) => {
  if (a === undefined || a === null) return b === undefined || b === null ? 0 : -1;
  if (b === undefined || b === null) return 1;

  const rankA = typeRank(a);
  const rankB = typeRank(b);
  if (rankA !== rankB) return rankA < rankB ? -1 : 1;

  if (Array.isArray(a) && Array.isArray(b)) {
    const left = a.length ? a[0] : undefined;
    const right = b.length ? b[0] : undefined;
    return compareValues(left, right);
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime() ? 0 : a.getTime() < b.getTime() ? -1 : 1;
  }
  if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
  if (typeof a === "string" && typeof b === "string") {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) === Number(b) ? 0 : a ? 1 : -1;
  }
  const left = String(a);
  const right = String(b);
  return left === right ? 0 : left < right ? -1 : 1;
};

/** Build a RegExp from either a RegExp or `{ $regex, $options }`. */
const toRegExp = (value, options) => {
  if (value instanceof RegExp) return value;
  if (typeof value === "string") {
    const flags = typeof options === "string" ? options.replace(/[^gimsuy]/g, "") : "";
    try {
      return new RegExp(value, flags);
    } catch {
      return /$^/;
    }
  }
  return /$^/;
};

const regexTest = (rx, value) => {
  if (typeof value === "string") {
    rx.lastIndex = 0;
    return rx.test(value);
  }
  if (Array.isArray(value)) return value.some((entry) => regexTest(rx, entry));
  if (isObjectId(value)) return regexTest(rx, value.toString());
  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => regexTest(rx, entry));
  }
  return false;
};

module.exports = {
  ObjectId,
  cloneValue,
  compareValues,
  getPath,
  isObjectId,
  isOperatorExpression,
  isPlainObject,
  looseEq,
  regexTest,
  setPath,
  toRegExp,
  unsetPath,
};