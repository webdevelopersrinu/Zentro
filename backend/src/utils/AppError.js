import { HTTP_STATUS } from "../constants/index.js";

/**
 * An error the API is allowed to show the client. Anything thrown that is NOT
 * an AppError is treated as a bug and reported as a generic 500.
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = "Bad request") {
    return new AppError(msg, HTTP_STATUS.BAD_REQUEST);
  }
  static unauthorized(msg = "Unauthorized") {
    return new AppError(msg, HTTP_STATUS.UNAUTHORIZED);
  }
  static forbidden(msg = "Forbidden") {
    return new AppError(msg, HTTP_STATUS.FORBIDDEN);
  }
  static notFound(msg = "Not found") {
    return new AppError(msg, HTTP_STATUS.NOT_FOUND);
  }
  static conflict(msg = "Conflict") {
    return new AppError(msg, HTTP_STATUS.CONFLICT);
  }
  static tooManyRequests(msg = "Too many requests") {
    return new AppError(msg, HTTP_STATUS.TOO_MANY_REQUESTS);
  }
}
