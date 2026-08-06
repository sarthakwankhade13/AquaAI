/**
 * Custom operational error class to distinguish between intentional errors
 * (validation, resource missing, bad credentials) and unexpected programming bugs.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error details
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates this is a client-safe operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
export { AppError };
