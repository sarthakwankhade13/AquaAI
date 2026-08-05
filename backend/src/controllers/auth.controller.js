'use strict';

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const HttpStatus = require('../constants/httpStatus');

/**
 * POST /api/v1/auth/login
 * Authenticates the user and returns access + refresh tokens.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const meta = {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  const result = await authService.login(email, password, meta);

  return sendSuccess(res, HttpStatus.OK, 'Login successful', result);
});

/**
 * POST /api/v1/auth/logout
 * Invalidates the user's refresh token.
 * Requires: Bearer access token in Authorization header.
 */
const logout = asyncHandler(async (req, res) => {
  const { userId, email } = req.user;

  const meta = {
    email,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  await authService.logout(userId, meta);

  return sendSuccess(res, HttpStatus.OK, 'Logged out successfully');
});

/**
 * POST /api/v1/auth/refresh-token
 * Accepts a valid refresh token and returns a new access token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  const result = await authService.refreshAccessToken(token);

  return sendSuccess(res, HttpStatus.OK, 'Access token refreshed', result);
});

/**
 * GET /api/v1/auth/me
 * Returns the profile of the currently authenticated user.
 * Requires: Bearer access token in Authorization header.
 */
const getMe = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const user = await authService.getProfile(userId);

  return sendSuccess(res, HttpStatus.OK, 'Profile fetched successfully', { user });
});

module.exports = { login, logout, refreshToken, getMe };
