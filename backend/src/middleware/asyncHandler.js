/**
 * Wraps a route handler so ANY failure reaches Express's error middleware
 * instead of hanging the request. Removes try/catch from every controller.
 *
 * The try/catch matters: `Promise.resolve(fn(...))` cannot capture a throw that
 * happens synchronously inside fn, before a promise exists. Express 4 catches
 * sync throws itself, but relying on that makes the wrapper untestable in
 * isolation and breaks the moment it is used outside a route.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  try {
    return Promise.resolve(fn(req, res, next)).catch(next);
  } catch (err) {
    next(err);
  }
};
