/**
 * role.middleware.js — RBAC Role Guard Factory
 *
 * Returns a middleware function that restricts access to users
 * whose role matches one of the provided allowed roles.
 * Must be used AFTER authenticate() middleware.
 *
 * Usage:
 *   import ROLES from '../constants/roles.js'
 *   router.delete('/user/:id', authenticate, authorise(ROLES.WRD_ADMIN), handler)
 */

import { sendError } from '../utils/apiResponse.js';
import HTTP from '../constants/httpStatus.js';

/**
 * @param {...string} allowedRoles - One or more permitted role strings
 * @returns {Function} Express middleware
 */
const authorise = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, HTTP.UNAUTHORIZED, 'Not authenticated');
  }

  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, HTTP.FORBIDDEN, 'You do not have permission to perform this action');
  }

  next();
};

export { authorise };
