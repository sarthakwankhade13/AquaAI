/**
 * httpStatus.js — HTTP Status Code Constants
 *
 * Named constants for every HTTP status code used in the application.
 * Eliminates magic numbers across controllers, services, and middlewares.
 *
 * Usage: import HTTP from '../constants/httpStatus.js'
 *        res.status(HTTP.OK) ...
 */

const HTTP = Object.freeze({
  // ─── 2xx Success ───────────────────────────────────────────
  OK                   : 200,
  CREATED              : 201,
  ACCEPTED             : 202,
  NO_CONTENT           : 204,

  // ─── 4xx Client Errors ─────────────────────────────────────
  BAD_REQUEST          : 400,
  UNAUTHORIZED         : 401,
  FORBIDDEN            : 403,
  NOT_FOUND            : 404,
  METHOD_NOT_ALLOWED   : 405,
  CONFLICT             : 409,
  GONE                 : 410,
  UNPROCESSABLE_ENTITY : 422,
  TOO_MANY_REQUESTS    : 429,

  // ─── 5xx Server Errors ─────────────────────────────────────
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY          : 502,
  SERVICE_UNAVAILABLE  : 503,
  GATEWAY_TIMEOUT      : 504,
});

export default HTTP;
