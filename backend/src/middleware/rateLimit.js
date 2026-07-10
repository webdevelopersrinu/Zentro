import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../constants/index.js";

const isTest = process.env.NODE_ENV === "test";

const base = {
  standardHeaders: "draft-7", // RateLimit-* response headers
  legacyHeaders: false,
  skip: () => isTest, // never throttle the test suite
  message: { error: "Too many requests, please try again later" },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
};

/** Broad protection for the whole API. */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 300,
});

/**
 * OAuth endpoints are the cheapest thing to hammer and the most valuable to
 * abuse (session churn, provider quota, redirect probing). Keep them tight.
 */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 20,
});

/** Writes are more expensive than reads; cap them separately. */
export const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 60,
});
