import { stripMongoOperators } from "../utils/sanitize.js";

/**
 * NoSQL injection guard. Without it, a body like
 *   { "username": { "$ne": null } }
 * reaches Mongoose as a query operator instead of a string.
 *
 * zod already rejects non-strings on validated routes, but this runs on every
 * request — including params and query — so a new route is safe by default.
 */
export const sanitizeRequest = (req, _res, next) => {
  stripMongoOperators(req.body);
  stripMongoOperators(req.params);
  stripMongoOperators(req.query); // mutated in place: req.query is getter-only
  next();
};
