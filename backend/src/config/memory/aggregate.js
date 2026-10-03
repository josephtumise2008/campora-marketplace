"use strict";

/**
 * A very small aggregation pipeline runner covering the stages and
 * accumulators the Campora reports and dashboards use:
 *
 *   $match, $group ($sum $avg $min $max $first $last $addToSet $push $count),
 *   $sort, $limit, $skip, $project, $unwind, $lookup, $set/$addFields,
 *   $count, $replaceRoot
 */

const { cloneValue, compareValues, getPath, isPlainObject, setPath, unsetPath } = require("./support");
const { matchesFilter } = require("./match");
const { sortDocs } = require("./projection");

/** Resolve a field expression such as `"$totals.total"` or a literal. */
const evaluate = (expression, doc) => {
  if (typeof expression === "string" && expression.startsWith("$")) {
    return getPath(doc, expression.slice(1));
  }
  if (isPlainObject(expression)) {
    const keys = Object.keys(expression);
    if (keys.length === 1 && keys[0].startsWith("$")) {
      const operator = keys[0];
      const operand = expression[operator];
      switch (operator) {
        case "$literal":
          return operand;
        case "$dateToString": {
          const date = evaluate(operand.date, doc);
          if (!(date instanceof Date)) return null;
          return formatDate(date, operand.format || "%Y-%m-%d");
        }
        case "$toString": {
          const value = evaluate(operand, doc);
          return value === null || value === undefined ? null : String(value);
        }
        case "$toDouble":
        case "$toInt": {
          const value = evaluate(operand, doc);
          return value === undefined || value === null ? null : Number(value);
        }
        case "$ifNull": {
          const [fallback, alternate] = operand;
          const value = evaluate(fallback, doc);
          return value === null || value === undefined ? evaluate(alternate, doc) : value;
        }
        case "$cond": {
          const [test, whenTrue, whenFalse] = operand;
          return matchesFilter(doc, test) ? evaluate(whenTrue, doc) : evaluate(whenFalse, doc);
        }
        case "$concat": {
          return operand
            .map((part) => {
              const value = evaluate(part, doc);
              return value === null || value === undefined ? "" : String(value);
            })
            .join("");
        }
        case "$size": {
          const value = evaluate(operand, doc);
          return Array.isArray(value) ? value.length : 0;
        }
        case "$multiply":
          return operand.reduce((acc, part) => acc * Number(evaluate(part, doc) || 0), 1);
        case "$add":
          return operand.reduce((acc, part) => acc + Number(evaluate(part, doc) || 0), 0);
        case "$subtract":
          return Number(evaluate(operand[0], doc) || 0) - Number(evaluate(operand[1], doc) || 0);
        default:
          return null;
      }
    }
    const out = {};
    for (const [key, value] of Object.entries(expression)) {
      out[key] = evaluate(value, doc);
    }
    return out;
  }
  return expression;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The `%Y-%m-%d` style formats used by the revenue charts. */
const formatDate = (date, format) => {
  const pad = (value) => String(value).padStart(2, "0");
  const tokens = {
    "%Y": String(date.getUTCFullYear()),
    "%m": pad(date.getUTCMonth() + 1),
    "%d": pad(date.getUTCDate()),
    "%H": pad(date.getUTCHours()),
    "%M": pad(date.getUTCMinutes()),
    "%S": pad(date.getUTCSeconds()),
    "%B": MONTHS[date.getUTCMonth()],
    "%b": MONTHS[date.getUTCMonth()].slice(0, 3),
    "%-d": String(date.getUTCDate()),
    "%j": pad(Math.ceil((date - new Date(Date.UTC(date.getUTCFullYear(), 0, 0))) / 86400000)),
    "%w": String(date.getUTCDay()),
  };
  return format.replace(/%-?[YmdHMSBbjw]/g, (token) => tokens[token] ?? token);
};

/* ------------------------------------------------------------------ *
 * Accumulators
 * ------------------------------------------------------------------ */

const ACCUMULATORS = {
  $sum: (state, expression, doc) => {
    const value = evaluate(expression, doc);
    if (value === null || value === undefined) return state;
    return state + (typeof value === "number" ? value : Number(value) || 0);
  },
  $avg: (state, expression, doc) => {
    const value = Number(evaluate(expression, doc));
    if (!Number.isFinite(value)) return state;
    state.total += value;
    state.count += 1;
    return state;
  },
  $min: (state, expression, doc) => {
    const value = evaluate(expression, doc);
    if (value === null || value === undefined) return state;
    if (state === undefined || compareValues(value, state) < 0) return value;
    return state;
  },
  $max: (state, expression, doc) => {
    const value = evaluate(expression, doc);
    if (value === null || value === undefined) return state;
    if (state === undefined || compareValues(value, state) > 0) return value;
    return state;
  },
  $first: (state, expression, doc) => (state.initialized ? state : evaluate(expression, doc)),
  $last: (state, expression, doc) => evaluate(expression, doc),
  $push: (state, expression, doc) => {
    state.push(evaluate(expression, doc));
    return state;
  },
  $addToSet: (state, expression, doc) => {
    const value = evaluate(expression, doc);
    if (value === undefined) return state;
    if (!state.some((entry) => String(entry) === String(value))) state.push(value);
    return state;
  },
  $count: (state, expression, doc) => {
    state.count += 1;
    return state;
  },
};

const finalizeAccumulator = (operator, state) => {
  if (operator === "$avg") return state.count ? state.total / state.count : null;
  if (operator === "$count") return state.count;
  return state;
};

const initialAccumulator = (operator) => {
  if (operator === "$avg") return { total: 0, count: 0 };
  if (operator === "$count") return { count: 0 };
  if (operator === "$sum") return 0;
  if (operator === "$push" || operator === "$addToSet") return [];
  return undefined;
};

/* ------------------------------------------------------------------ *
 * Stages
 * ------------------------------------------------------------------ */

const groupStage = (docs, spec) => {
  const fields = Object.entries(spec).filter(([key]) => key !== "_id");
  const groups = new Map();

  docs.forEach((doc) => {
    const id = spec._id ? evaluate(spec._id, doc) : null;
    const key = id === null || id === undefined ? "__null__" : typeof id + ":" + String(id);
    if (!groups.has(key)) {
      const group = { _id: id };
      fields.forEach(([name, accumulator]) => {
        group[name] = initialAccumulator(Object.keys(accumulator)[0]);
      });
      groups.set(key, group);
    }
    const group = groups.get(key);
    fields.forEach(([name, accumulator]) => {
      const operator = Object.keys(accumulator)[0];
      const handler = ACCUMULATORS[operator];
      if (!handler) return;
      if (operator === "$first") {
        const value = evaluate(accumulator[operator], doc);
        if (group[name] === undefined) group[name] = value;
        return;
      }
      if (operator === "$last") {
        group[name] = evaluate(accumulator[operator], doc);
        return;
      }
      group[name] = handler(group[name], accumulator[operator], doc);
    });
  });

  return [...groups.values()].map((group) => {
    fields.forEach(([name, accumulator]) => {
      const operator = Object.keys(accumulator)[0];
      group[name] = cloneValue(finalizeAccumulator(operator, group[name]));
    });
    return group;
  });
};

const projectStage = (docs, spec) => {
  const includes = Object.entries(spec).filter(([, value]) => value === 1 || value === true);
  const excludes = Object.entries(spec).filter(([, value]) => value === 0 || value === false);
  const computed = Object.entries(spec).filter(
    ([, value]) => value !== 1 && value !== true && value !== 0 && value !== false
  );

  const exclusionOnly = includes.length === 0;

  return docs.map((doc) => {
    // Exclusion-only projections keep the whole document and drop fields;
    // inclusion projections start empty. Dotted keys such as `store.name`
    // build nested output, exactly like MongoDB.
    const out = exclusionOnly ? cloneValue(doc) : {};

    includes.forEach(([field]) => {
      if (field === "_id") {
        out._id = doc._id;
        return;
      }
      setPath(out, field, cloneValue(getPath(doc, field)));
    });

    computed.forEach(([field, expression]) => {
      const value = evaluate(expression, doc);
      if (field.includes(".")) setPath(out, field, cloneValue(value));
      else out[field] = cloneValue(value);
    });

    if (spec._id === 1 || spec._id === true) out._id = doc._id;
    if (spec._id === 0 || spec._id === false || (exclusionOnly && spec._id === undefined && includes.length)) {
      delete out._id;
    }

    excludes.forEach(([field]) => {
      unsetPath(out, field);
    });

    return out;
  });
};

const unwindStage = (docs, spec) => {
  const path = typeof spec === "string" ? spec : spec && spec.path;
  const preserve = typeof spec === "object" && Boolean(spec && spec.preserveNullAndEmptyArrays);
  const field = String(path || "").replace(/^\$/, "");
  const segments = field.split(".");

  return docs.flatMap((doc) => {
    const value = getPath(doc, field);
    if (value === undefined || value === null || (Array.isArray(value) && !value.length)) {
      return preserve ? [doc] : [];
    }
    const list = Array.isArray(value) ? value : [value];
    return list.map((entry) => {
      const copy = cloneValue(doc);
      let cursor = copy;
      for (let i = 0; i < segments.length - 1; i += 1) cursor = cursor[segments[i]];
      cursor[segments[segments.length - 1]] = entry;
      return copy;
    });
  });
};

const lookupStage = (docs, spec, registry) => {
  const from = String(spec.from || "");
  const target = registry.get(from);
  if (!target) return docs;

  return docs.map((doc) => {
    const copy = doc;
    const localValue = spec.localField ? getPath(doc, spec.localField) : null;
    const matches = target.docs.filter((candidate) => {
      const foreignValue = getPath(candidate, spec.foreignField);
      if (Array.isArray(localValue)) {
        return localValue.some((entry) => String(entry) === String(foreignValue));
      }
      return String(localValue) === String(foreignValue);
    });
    copy[spec.as] = matches;
    return copy;
  });
};

/* ------------------------------------------------------------------ *
 * Runner
 * ------------------------------------------------------------------ */

const runPipeline = (docs, pipeline, registry) => {
  let current = docs;

  for (const stage of pipeline || []) {
    const [operator] = Object.keys(stage);

    switch (operator) {
      case "$match":
        current = current.filter((doc) => matchesFilter(doc, stage.$match));
        break;
      case "$group":
        current = groupStage(current, stage.$group);
        break;
      case "$sort":
        current = sortDocs(current, stage.$sort);
        break;
      case "$limit":
        current = current.slice(0, stage.$limit);
        break;
      case "$skip":
        current = current.slice(stage.$skip);
        break;
      case "$project":
        current = projectStage(current, stage.$project);
        break;
      case "$unwind":
        current = unwindStage(current, stage.$unwind);
        break;
      case "$lookup":
        current = lookupStage(current, stage.$lookup, registry);
        break;
      case "$set":
      case "$addFields": {
        const fields = stage[operator];
        current = current.map((doc) => {
          const copy = doc;
          for (const [field, expression] of Object.entries(fields)) {
            copy[field] = evaluate(expression, doc);
          }
          return copy;
        });
        break;
      }
      case "$count":
        current = [{ [stage.$count]: current.length }];
        break;
      case "$replaceRoot":
        current = current.map((doc) => evaluate(stage.$replaceRoot.newRoot, doc));
        break;
      case "$replaceWith":
        current = current.map((doc) => evaluate(stage.$replaceWith, doc));
        break;
      default:
        throw new Error(`[memory-db] Unsupported aggregation stage: ${operator}`);
    }
  }

  return current;
};

module.exports = { runPipeline, evaluate };