import sanitizeHtml from "sanitize-html";

/**
 * Strip ALL markup. Chat messages and room names are plain text; there is no
 * legitimate reason for a user to submit HTML.
 *
 * React escapes on render, so this is defence in depth — it protects any other
 * consumer of the data (exports, emails, a future non-React client) and stops
 * stored XSS at the source rather than at the last mile.
 */
export const stripHtml = (value) =>
  sanitizeHtml(String(value ?? ""), {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();

/**
 * Remove MongoDB operator keys ($gt, $ne, …) and dotted paths from an object
 * IN PLACE. Express defines req.query with a getter only, so the usual
 * `req.query = sanitize(req.query)` silently does nothing — we mutate instead.
 */
export function stripMongoOperators(value) {
  if (!value || typeof value !== "object") return value;

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
    } else {
      stripMongoOperators(value[key]);
    }
  }
  return value;
}
