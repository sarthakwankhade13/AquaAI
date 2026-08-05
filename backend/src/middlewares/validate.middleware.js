/**
 * validate.middleware.js — Request Validation Error Handler
 *
 * Runs AFTER express-validator chains in route definitions.
 * Collects all validation errors and returns a structured 422 response.
 * If no errors, calls next() to pass control to the controller.
 *
 * Usage in routes:
 *   router.post('/login', loginValidator, validate, authController.login)
 */

import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';
import HTTP from '../constants/httpStatus.js';

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field  : err.path,
      message: err.msg,
    }));
    return sendError(res, HTTP.UNPROCESSABLE_ENTITY, 'Validation failed', errors);
  }

  next();
};

export { validate };
