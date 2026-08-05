/**
 * tokenHelper.js — JWT Sign & Verify Utilities
 *
 * Wrapper around the jsonwebtoken library.
 * Used exclusively by the Auth module — not imported by foundation layer.
 * Kept here so Auth feature can import it directly.
 *
 * Usage (Auth module):
 *   import { signAccessToken, verifyAccessToken } from '../utils/tokenHelper.js'
 */

import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';

/** Signs a short-lived access token */
const signAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.access.secret, { expiresIn: jwtConfig.access.expiresIn });

/** Signs a long-lived refresh token */
const signRefreshToken = (payload) =>
  jwt.sign(payload, jwtConfig.refresh.secret, { expiresIn: jwtConfig.refresh.expiresIn });

/** Verifies and decodes an access token — throws on invalid/expired */
const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.access.secret);

/** Verifies and decodes a refresh token — throws on invalid/expired */
const verifyRefreshToken = (token) =>
  jwt.verify(token, jwtConfig.refresh.secret);

/**
 * Converts a JWT expiry string (e.g. '7d', '15m') to milliseconds.
 * Used to calculate refresh token DB expiry timestamp.
 */
const expiryToMs = (expiry) => {
  const unit  = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const map   = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (map[unit] ?? 1_000);
};

export { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, expiryToMs };
