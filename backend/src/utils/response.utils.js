import HTTP from '../constants/httpStatus.js';

/**
 * Sends a standardised success response.
 * Format: { success: true, message: "...", data: {...} }
 * 
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object|array|null} data - Success payload
 * @returns {object} Express JSON response
 */
export const sendSuccess = (res, statusCode = HTTP.OK, message = 'Success', data = null) => {
  const body = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
};

/**
 * Sends a standardised failure response.
 * Format: { success: false, message: "...", errors: [...] }
 * 
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message summary
 * @param {array|null} errors - Detailed errors/validation failure lists
 * @returns {object} Express JSON response
 */
export const sendError = (res, statusCode = HTTP.INTERNAL_SERVER_ERROR, message = 'Error occurred', errors = null) => {
  const body = {
    success: false,
    message,
  };
  if (errors !== null && errors !== undefined) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
};
