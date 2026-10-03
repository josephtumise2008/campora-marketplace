const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const Store = require("../models/Store");
const tokenService = require("../services/tokenService");

const extractToken = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
};

const attachUser = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = tokenService.verify(token);
    const user = await User.findById(payload.sub).select("-password");
    if (!user || !user.isActive) return next();
    req.user = user;
    if (user.store) {
      req.store = await Store.findById(user.store).select(
        "name slug logo verification status rating"
      );
    }
    return next();
  } catch (error) {
    return next();
  }
};

const protect = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized("Please sign in to continue");
    const payload = tokenService.verify(token);
    const user = await User.findById(payload.sub).select("-password");
    if (!user) throw ApiError.unauthorized("Your session is no longer valid");
    if (!user.isActive) throw ApiError.forbidden("This account has been disabled");
    req.user = user;
    return next();
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(ApiError.unauthorized("Your session has expired, please sign in again"));
  }
};

const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Please sign in to continue"));
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to access this resource")
      );
    }
    return next();
  };

const requireSeller = async (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized("Please sign in to continue"));
  if (req.user.role !== "seller" && req.user.role !== "admin") {
    return next(ApiError.forbidden("This area is for Campora sellers"));
  }
  if (req.user.role === "seller" && !req.user.store) {
    return next(
      ApiError.forbidden("Finish setting up your store before opening the dashboard")
    );
  }
  if (req.user.role === "seller") {
    const store = req.store || (await Store.findById(req.user.store).select("verification"));
    req.store = store;
    if (store && store.verification === "pending") {
      return next(
        ApiError.forbidden(
          "Your store application is still under review. We will email you as soon as it is approved."
        )
      );
    }
    if (store && store.verification === "suspended") {
      return next(
        ApiError.forbidden("Your store is suspended. Contact Campora support to restore it.")
      );
    }
  }
  return next();
};

module.exports = { attachUser, protect, authorize, requireSeller };
