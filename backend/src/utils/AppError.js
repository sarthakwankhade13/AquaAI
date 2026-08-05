/**
 * AppError.js — Custom Operational Error Class
 *
 * Extends the native Error with a `statusCode` and `isOperational` flag.
 *
 * isOperational = true  → Safe to expose message to client (intended throw)
 * isOperational = false → Unexpected programmer error (hide in production)
 *
 * The global error handler checks this flag to decide what to send back.
 *
 * Usage:
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Invalid email or password', 401);
 */

class AppError extends Error {
  /**
   * @param {string} message    - Human-readable error message (sent to client)
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode    = statusCode;
    this.isOperational = true; // Marks this as an intentional, handled error

    // Captures where the error was thrown (excludes this constructor from stack)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
