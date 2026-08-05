/**
 * apiResponse.js — Standardised API Response Helpers
 *
 * All API responses MUST go through these helpers to guarantee
 * a consistent JSON shape across the entire application.
 *
 * Success shape:  { success: true,  message: '', data: {}   }
 * Error shape:    { success: false, message: '', errors: [] }
 *
 * Usage:
 *   sendSuccess(res, 200, 'Login successful', { user, token });
 *   sendError(res, 422, 'Validation failed', [{ field, message }]);
 */

import HTTP from '../constants/httpStatus.js';

/**
 * Sends a standardised success response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode  - HTTP status code (default 200)
 * @param {string} message     - Human-readable success message
 * @param {*}      [data]      - Response payload (omitted if null)
 * @param {object} [meta]      - Pagination / extra metadata (optional)
 */
const sendSuccess = (res, statusCode = HTTP.OK, message = 'Success', data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  if (meta !== null && meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Sends a standardised error response.
 *
 * @param {import('express').Response} res
 * @param {number}      statusCode  - HTTP status code (default 500)
 * @param {string}      message     - Error summary
 * @param {Array|null}  [errors]    - Field-level validation errors (optional)
 */
const sendError = (res, statusCode = HTTP.INTERNAL_SERVER_ERROR, message = 'Something went wrong', errors = null) => {
  const body = { success: false, message };
  if (errors !== null && errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
};

export { sendSuccess, sendError };
