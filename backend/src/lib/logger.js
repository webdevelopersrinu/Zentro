const silent = process.env.NODE_ENV === "test";

/**
 * Minimal logger. Info is suppressed under test so per-connection chatter
 * doesn't fire after a test runner has torn down (and to keep output readable).
 * Errors always surface.
 */
export const logger = {
  info: (...args) => {
    if (!silent) console.log(...args);
  },
  error: (...args) => console.error(...args),
};
