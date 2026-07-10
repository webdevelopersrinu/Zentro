import { AppError } from "../utils/AppError.js";

const formatIssues = (error) =>
  error.issues
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");

const parse = (schema, value, next) => {
  const result = schema.safeParse(value);
  if (!result.success) {
    next(AppError.badRequest(formatIssues(result.error)));
    return null;
  }
  return result.data;
};

/**
 * Validates req.body and replaces it with the parsed result, so controllers
 * receive coerced, trimmed, defaulted values and never re-check.
 *
 *   router.post("/", validateBody(createRoomSchema), roomController.create)
 */
export const validateBody = (schema) => (req, _res, next) => {
  const data = parse(schema, req.body, next);
  if (data === null) return;
  req.body = data;
  next();
};

/**
 * Same for the query string, but exposed as `req.validatedQuery` — Express
 * defines `req.query` with a getter only, so assigning to it throws.
 */
export const validateQuery = (schema) => (req, _res, next) => {
  const data = parse(schema, req.query, next);
  if (data === null) return;
  req.validatedQuery = data;
  next();
};
