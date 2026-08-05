/**
 * asyncHandler.js — Async Route Handler Wrapper
 *
 * Wraps any async Express route handler so that rejected Promises
 * are automatically forwarded to next(err) and caught by the
 * global error handler. Eliminates repetitive try/catch blocks.
 *
 * Usage:
 *   router.get('/me', asyncHandler(async (req, res) => {
 *     const user = await userService.getById(req.user.id);
 *     sendSuccess(res, 200, 'OK', user);
 *   }));
 */

/**
 * @param {Function} fn - Async route handler
 * @returns {Function}  - Express-compatible middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
