"use strict";

/**
 * Filter matching for the in-memory query engine.
 *
 * Covers the operator set the Campora controllers use: implicit equality,
 * `$in`, `$nin`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`, `$regex`,
 * `$options`, `$all`, `$elemMatch`, `$size`, `$not`, plus the logical
 * combinators `$and`, `$or` and `$nor`.
 */

const {
  compareValues,
  getPath,
  isPlainObject,
  looseEq,
  regexTest,
  toRegExp,
} = require("./support");

const isOperatorKey = (key) => key.startsWith("$");

const equalsValue = (docValue, expected) => {
  if (Array.isArray(docValue)) {
    if (Array.isArray(expected)) {
      if (docValue.length !== expected.length) return false;
      return docValue.every((entry, index) => looseEq(entry, expected[index]));
    }
    return docValue.some((entry) => looseEq(entry, expected));
  }
  return looseEq(docValue, expected);
};

const compareOperator = (docValue, operator, operand) => {
  switch (operator) {
    case "$eq":
      return equalsValue(docValue, operand);
    case "$ne":
      return !equalsValue(docValue, operand);
    case "$in":
      return asList(operand).some((candidate) => equalsValue(docValue, candidate));
    case "$nin":
      return !asList(operand).some((candidate) => equalsValue(docValue, candidate));
    case "$exists":
      return (docValue !== undefined) === Boolean(operand);
    case "$all":
      return (
        Array.isArray(docValue) &&
        asList(operand).every((candidate) => docValue.some((entry) => looseEq(entry, candidate)))
      );
    case "$size":
      return Array.isArray(docValue) && docValue.length === operand;
    case "$elemMatch":
      return (
        Array.isArray(docValue) && docValue.some((entry) => matchesFilter(entry, operand))
      );
    case "$regex":
      return regexTest(toRegExp(operand), docValue);
    case "$not":
      return !matchesCondition(docValue, operand);
    default:
      break;
  }

  if (docValue === undefined || docValue === null) return false;
  const candidates = Array.isArray(docValue) ? docValue : [docValue];
  return candidates.some((value) => {
    if (operator === "$gt") return compareValues(value, operand) > 0;
    if (operator === "$gte") return compareValues(value, operand) >= 0;
    if (operator === "$lt") return compareValues(value, operand) < 0;
    if (operator === "$lte") return compareValues(value, operand) <= 0;
    return false;
  });
};

const asList = (value) => (Array.isArray(value) ? value : [value]);

/** Match a single field value against a condition. */
function matchesCondition(docValue, condition) {
  if (condition instanceof RegExp) return regexTest(condition, docValue);

  if (isPlainObject(condition) && Object.keys(condition).some(isOperatorKey)) {
    const hasRegex = Object.prototype.hasOwnProperty.call(condition, "$regex");
    if (hasRegex) {
      const rx = toRegExp(condition.$regex, condition.$options);
      const rest = Object.entries(condition).filter(
        ([operator]) => operator !== "$regex" && operator !== "$options"
      );
      return regexTest(rx, docValue) && rest.every(([operator, operand]) => compareOperator(docValue, operator, operand));
    }

    return Object.entries(condition).every(([operator, operand]) => {
      if (operator === "$options") return true;
      return compareOperator(docValue, operator, operand);
    });
  }

  return equalsValue(docValue, condition);
}

/** Match a whole document against a Mongo-style filter. */
function matchesFilter(doc, filter) {
  if (!filter) return true;
  if (!isPlainObject(filter)) return true;

  return Object.entries(filter).every(([key, condition]) => {
    if (key === "$and") return asList(condition).every((sub) => matchesFilter(doc, sub));
    if (key === "$or") return asList(condition).some((sub) => matchesFilter(doc, sub));
    if (key === "$nor") return !asList(condition).some((sub) => matchesFilter(doc, sub));
    if (key === "$not") return !matchesFilter(doc, condition);
    if (isOperatorKey(key)) return true;

    return matchesCondition(getPath(doc, key), condition);
  });
}

module.exports = { matchesFilter, matchesCondition, equalsValue };