const env = require("../config/env");
const ApiError = require("../utils/ApiError");

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";
  let details = error.details;

  if (error.name === "ValidationError") {
    statusCode = 422;
    message = "Please check the highlighted fields";
    details = Object.values(error.errors).map((e) => e.message);
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || { value: 1 })[0];
    message = `That ${field} is already in use`;
  }

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
    if (!env.isProduction) {
      details = details || error.message;
      message = error.message || "Internal server error";
    } else {
      message = "Something went wrong on our end";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: statusCode >= 500 ? error.stack : undefined }),
  });
};

module.exports = errorHandler;
