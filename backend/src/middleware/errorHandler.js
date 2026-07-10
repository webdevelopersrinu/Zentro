import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/index.js";

/** Any route that matched nothing. Runs before errorHandler. */
export const notFound = (req, _res, next) =>
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

/**
 * The only place that formats an error response. Translates known infrastructure
 * errors into AppErrors; anything else is a bug and becomes an opaque 500.
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err instanceof mongoose.Error.CastError) {
    error = AppError.notFound("Resource not found");
  } else if (err instanceof mongoose.Error.ValidationError) {
    const detail = Object.values(err.errors).map((e) => e.message).join(", ");
    error = AppError.badRequest(detail);
  } else if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    error = AppError.conflict(`That ${field} is already taken`);
  } else if (err?.type === "entity.too.large") {
    error = new AppError("Payload too large", HTTP_STATUS.PAYLOAD_TOO_LARGE);
  } else if (err?.type === "entity.parse.failed") {
    error = AppError.badRequest("Malformed JSON body");
  }

  if (!(error instanceof AppError)) {
    console.error("Unhandled error:", err);
    error = new AppError("Internal server error", HTTP_STATUS.INTERNAL);
  }

  const body = { error: error.message };
  if (process.env.NODE_ENV !== "production" && error.statusCode >= 500) {
    body.stack = err.stack;
  }
  res.status(error.statusCode).json(body);
};
