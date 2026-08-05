/**
 * notFound.middleware.js — 404 Not Found Handler
 *
 * Registered AFTER all routes and BEFORE the global error handler.
 * Catches any request that didn't match a defined route and returns
 * a clean 404 JSON response instead of Express's default HTML page.
 *
 * Usage in app.js:
 *   app.use(notFound);
 *   app.use(errorHandler); // must be last
 */

import { sendError } from '../utils/apiResponse.js';
import HTTP from '../constants/httpStatus.js';

const notFound = (req, res) => {
  sendError(
    res,
    HTTP.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`
  );
};

export { notFound };
