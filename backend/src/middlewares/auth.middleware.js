/**
 * auth.middleware.js — JWT Access Token Verifier
 *
 * Protects routes by verifying the Bearer access token in the
 * Authorization header. Attaches decoded payload to req.user.
 *
 * Used in Auth module and all subsequent protected routes.
 * Not active in the foundation layer — imported when Auth is built.
 *
 * Usage:
 *   router.get('/me', authenticate, controller.getMe)
 */

import { verifyAccessToken } from '../utils/tokenHelper.js';
import { sendError } from '../utils/apiResponse.js';
import HTTP from '../constants/httpStatus.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, HTTP.UNAUTHORIZED, 'Access token missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyAccessToken(token); // { userId, email, role, iat, exp }
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Access token expired'
      : 'Invalid access token';
    return sendError(res, HTTP.UNAUTHORIZED, message);
  }
};

export { authenticate };
