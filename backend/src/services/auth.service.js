'use strict';

const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repository');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const { signAccessToken, signRefreshToken, verifyRefreshToken, expiryToMs } = require('../utils/tokenHelper');
const jwtConfig = require('../config/jwt');
const env = require('../config/env');
const HttpStatus = require('../constants/httpStatus');

/**
 * Custom operational error class.
 * Errors flagged with isOperational are returned to the client as-is.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * Authenticates a user with email and password.
 * Returns signed access + refresh tokens on success.
 * @param {string} email
 * @param {string} password
 * @param {object} meta - { ipAddress, userAgent }
 * @returns {{ accessToken, refreshToken, user }}
 */
const login = async (email, password, meta = {}) => {
  // 1. Fetch user
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
  }

  // 2. Check account status
  if (user.status !== 'active') {
    throw new AppError('Your account has been deactivated. Contact administrator.', HttpStatus.UNAUTHORIZED);
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
  }

  // 4. Build token payload (keep it minimal)
  const payload = { userId: user.id, email: user.email, role: user.role };

  // 5. Sign tokens
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // 6. Hash and persist refresh token
  const hashedRefresh = await bcrypt.hash(refreshToken, env.bcrypt.saltRounds);
  const expiresAt = new Date(Date.now() + expiryToMs(jwtConfig.refresh.expiresIn));
  await refreshTokenRepo.save(user.id, hashedRefresh, expiresAt);

  // 7. Update last login timestamp
  await userRepo.updateLastLogin(user.id);

  // 8. Write audit log (fire-and-forget — don't block login on log failure)
  auditLogRepo.log({
    userId: user.id,
    action: 'LOGIN',
    module: 'AUTH',
    description: `User ${user.email} logged in successfully`,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  }).catch(() => {});

  // 9. Return safe user object (no password)
  const { password: _pw, ...safeUser } = user;

  return { accessToken, refreshToken, user: safeUser };
};

/**
 * Invalidates the user's current refresh token (logout).
 * @param {number} userId
 * @param {object} meta - { ipAddress, userAgent, email }
 */
const logout = async (userId, meta = {}) => {
  await refreshTokenRepo.deleteByUserId(userId);

  auditLogRepo.log({
    userId,
    action: 'LOGOUT',
    module: 'AUTH',
    description: `User ${meta.email || userId} logged out`,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  }).catch(() => {});
};

/**
 * Validates an incoming refresh token and issues a new access token.
 * @param {string} incomingRefreshToken
 * @returns {{ accessToken }}
 */
const refreshAccessToken = async (incomingRefreshToken) => {
  // 1. Verify JWT signature and expiry
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
  }

  // 2. Fetch stored token record
  const stored = await refreshTokenRepo.findByUserId(decoded.userId);
  if (!stored) {
    throw new AppError('Session not found. Please log in again.', HttpStatus.UNAUTHORIZED);
  }

  // 3. Check DB expiry
  if (new Date(stored.expires_at) < new Date()) {
    await refreshTokenRepo.deleteByUserId(decoded.userId);
    throw new AppError('Refresh token expired. Please log in again.', HttpStatus.UNAUTHORIZED);
  }

  // 4. Verify incoming token matches stored hash
  const isValid = await bcrypt.compare(incomingRefreshToken, stored.token_hash);
  if (!isValid) {
    throw new AppError('Invalid refresh token', HttpStatus.UNAUTHORIZED);
  }

  // 5. Issue new access token
  const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
  const accessToken = signAccessToken(payload);

  return { accessToken };
};

/**
 * Retrieves the authenticated user's profile.
 * @param {number} userId
 * @returns {object} User profile (no password)
 */
const getProfile = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new AppError('User not found', HttpStatus.NOT_FOUND);
  }
  return user;
};

module.exports = { login, logout, refreshAccessToken, getProfile };
