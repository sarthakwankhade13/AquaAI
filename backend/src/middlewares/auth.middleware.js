import { verifyAccessToken } from '../utils/jwt.utils.js';
import { findUserById } from '../repositories/auth.repository.js';
import { sendError } from '../utils/response.utils.js';
import HTTP from '../constants/httpStatus.js';
import logger from '../utils/logger.js';

/**
 * Middleware to verify JWT and authenticate the request.
 */
export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, HTTP.UNAUTHORIZED, 'Access token is required. Format: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, HTTP.UNAUTHORIZED, 'Access token expired');
      }
      return sendError(res, HTTP.UNAUTHORIZED, 'Invalid access token');
    }

    // Fetch user from DB to verify they still exist and are active
    const user = await findUserById(decoded.userId);
    if (!user) {
      return sendError(res, HTTP.UNAUTHORIZED, 'User no longer exists');
    }

    if (!user.is_active) {
      return sendError(res, HTTP.UNAUTHORIZED, 'User account is deactivated');
    }

    // Attach user payload (including user_id and role_name) to request object
    req.user = {
      userId: user.user_id,
      email: user.email,
      mobile: user.mobile,
      role: user.role_name,
    };

    next();
  } catch (err) {
    logger.error(`Error in verifyJWT middleware: ${err.message}`);
    return sendError(res, HTTP.INTERNAL_SERVER_ERROR, 'Authentication error');
  }
};

/**
 * Middleware to restrict access based on roles.
 * Supports checking roles against specific list: WRD_ADMIN, DISTRICT_ADMIN, VILLAGE_OFFICER, DRIVER, CITIZEN.
 * 
 * @param {...string} allowedRoles - List of authorized roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, HTTP.FORBIDDEN, 'Access denied. Missing role information.');
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return sendError(res, HTTP.FORBIDDEN, `Access denied. Role '${req.user.role}' is not authorized for this resource.`);
    }

    next();
  };
};
