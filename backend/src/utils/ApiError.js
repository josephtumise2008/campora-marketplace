class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details !== undefined) {
      this.details = details;
    }
  }

  static badRequest(message = "Bad request", details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required", details) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = "You do not have permission to perform this action", details) {
    return new ApiError(403, message, details);
  }

  static notFound(message = "Resource not found", details) {
    return new ApiError(404, message, details);
  }

  static conflict(message = "Resource already exists", details) {
    return new ApiError(409, message, details);
  }

  static unprocessable(message = "Validation failed", details) {
    return new ApiError(422, message, details);
  }

  static internal(message = "Internal server error", details) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;
