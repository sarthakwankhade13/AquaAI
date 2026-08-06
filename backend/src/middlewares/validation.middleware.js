import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.utils.js';
import HTTP from '../constants/httpStatus.js';

/**
 * Middleware that inspects validation errors from express-validator.
 * If errors are found, formats them and intercepts the request with a 422 Unprocessable Entity response.
 */
export const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return sendError(res, HTTP.UNPROCESSABLE_ENTITY, 'Validation failed', formattedErrors);
  }
  next();
};
