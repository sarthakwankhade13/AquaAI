/**
 * error.middleware.js — Global Centralised Error Handler
 *
 * MUST be registered LAST in app.js (after all routes).
 * Express identifies it as an error handler by the 4-parameter signature.
 *
 * Handles:
 *  - Operational errors  (AppError) → sends exact message + statusCode
 *  - MySQL duplicate key            → 409 Conflict
 *  - JWT errors                     → 401 Unauthorized
 *  - Unknown / programmer errors    → 500 (message hidden in production)
 */

import { sendError } from '../utils/response.utils.js';
import HTTP from '../constants/httpStatus.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Always log the full error internally
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  // ── Intentional operational errors (thrown via AppError) ─────────────────
  if (err.isOperational) {
    return sendError(res, err.statusCode, err.message);
  }

  // ── MySQL: duplicate entry ────────────────────────────────────────────────
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, HTTP.CONFLICT, 'A record with this value already exists');
  }

  // ── MySQL: constraint violation ───────────────────────────────────────────
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, HTTP.BAD_REQUEST, 'Referenced record does not exist');
  }

  // ── JWT: bad token ────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, HTTP.UNAUTHORIZED, 'Invalid token');
  }

  // ── JWT: expired token ────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return sendError(res, HTTP.UNAUTHORIZED, 'Token has expired');
  }

  // ── Unknown / programmer error ────────────────────────────────────────────
  const message = env.isProd ? 'Internal server error' : err.message;
  return sendError(res, HTTP.INTERNAL_SERVER_ERROR, message);
};

export { errorHandler };
