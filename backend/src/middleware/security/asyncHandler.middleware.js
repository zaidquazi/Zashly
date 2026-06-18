/**
 * Wraps async route handlers — forwards errors to centralized error handler.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
