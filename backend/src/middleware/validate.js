const ApiError = require("../utils/ApiError");

const isEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || ""));

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

/** Minimal declarative body validator: pick("email", "password") */
const pick = (fields) => (req, _res, next) => {
  req.body = req.body || {};
  fields.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      req.body[field] = String(req.body[field]).trim();
    }
  });
  return next();
};

const requireFields = (fields) => (req, _res, next) => {
  const missing = fields.filter((f) => {
    const value = req.body?.[f];
    return value === undefined || value === null || value === "";
  });
  if (missing.length) {
    return next(
      ApiError.badRequest(`Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`)
    );
  }
  return next();
};

const validateEmail = (req, _res, next) => {
  if (!isEmail(req.body?.email)) return next(ApiError.badRequest("Please enter a valid email address"));
  return next();
};

const validateObjectId = (field) => (req, _res, next) => {
  if (!isObjectId(req.params[field])) {
    return next(ApiError.badRequest("That identifier is not valid"));
  }
  return next();
};

const validatePassword = (req, _res, next) => {
  const password = req.body?.password ?? req.body?.newPassword;
  if (!password || password.length < 8) {
    return next(ApiError.badRequest("Password must be at least 8 characters"));
  }
  return next();
};

module.exports = { pick, requireFields, validateEmail, validateObjectId, validatePassword, isEmail, isObjectId };
