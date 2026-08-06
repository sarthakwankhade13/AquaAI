import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';

/**
 * Signs a short-lived access token.
 * @param {object} payload - payload to embed in the token
 * @returns {string} Signed JWT
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn,
  });
};

/**
 * Signs a long-lived refresh token.
 * @param {object} payload - payload to embed in the token
 * @returns {string} Signed JWT
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.refresh.secret, {
    expiresIn: jwtConfig.refresh.expiresIn,
  });
};

/**
 * Verifies an access token. Throws error if invalid or expired.
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.access.secret);
};

/**
 * Verifies a refresh token. Throws error if invalid or expired.
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refresh.secret);
};

/**
 * Translates an expiry string (e.g. '7d', '15m') into milliseconds.
 * Useful for calculating date ranges in Javascript.
 * @param {string} expiry
 * @returns {number} Expiry time in milliseconds
 */
export const expiryToMs = (expiry) => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (map[unit] ?? 1000);
};
