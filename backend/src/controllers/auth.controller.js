import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.utils.js';
import asyncHandler from '../utils/asyncHandler.js';
import HTTP from '../constants/httpStatus.js';
import * as userService from '../services/user.service.js';

/**
 * Controller Layer for the Authentication Module.
 */

/**
 * Get available roles for signup form (public endpoint).
 */
export const getAvailableRoles = asyncHandler(async (req, res) => {
  const roles = await userService.listRoles();

  return sendSuccess(res, HTTP.OK, 'Roles fetched successfully', roles);
});

/**
 * Handle new user registration.
 */
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password, gender, roleId, address } = req.body;

  const user = await authService.register({
    fullName,
    email,
    mobile,
    password,
    gender,
    roleId,
    address,
  });

  return sendSuccess(res, HTTP.CREATED, 'Account created successfully. You can now log in.', { user });
});

/**
 * Helper to parse client user-agent details.
 * @param {string} userAgent 
 * @returns {object} { browser, operatingSystem, deviceInfo }
 */
const parseUserAgent = (userAgent = '') => {
  let browser = 'Unknown Browser';
  let operatingSystem = 'Unknown OS';
  let deviceInfo = 'Unknown Device';

  const ua = userAgent.toLowerCase();

  // Simple OS parsing
  if (ua.includes('windows')) operatingSystem = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) operatingSystem = 'macOS';
  else if (ua.includes('linux')) operatingSystem = 'Linux';
  else if (ua.includes('android')) operatingSystem = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) operatingSystem = 'iOS';

  // Simple Browser parsing
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // Simple Device parsing
  if (ua.includes('mobile')) deviceInfo = 'Mobile Device';
  else if (ua.includes('tablet')) deviceInfo = 'Tablet';
  else deviceInfo = 'Desktop';

  return { browser, operatingSystem, deviceInfo };
};

/**
 * Handle user login.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Extract client metadata for login history
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const rawUserAgent = req.headers['user-agent'] || '';
  const { browser, operatingSystem, deviceInfo } = parseUserAgent(rawUserAgent);

  const meta = {
    ipAddress,
    browser,
    operatingSystem,
    deviceInfo,
  };

  const result = await authService.login(email, password, meta);

  // Set HTTP-only cookie for secure refresh token storage
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching token lifespan
  });

  return sendSuccess(res, HTTP.OK, 'Login successful', {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken, // returned in JSON as requested
    user: result.user,
  });
});

/**
 * Handle user logout.
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  await authService.logout(userId);

  // Clear HTTP-only refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return sendSuccess(res, HTTP.OK, 'Logout successful');
});

/**
 * Handle refresh token rotation.
 */
export const refresh = asyncHandler(async (req, res) => {
  // Read refresh token from either cookie or body
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(HTTP.BAD_REQUEST).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  const result = await authService.refreshAccessToken(incomingRefreshToken);

  // Set the newly rotated refresh token in cookies
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, HTTP.OK, 'Token refreshed successfully', {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

/**
 * Handle password-reset OTP dispatch.
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  const result = await authService.sendOtp(mobile);

  return sendSuccess(res, HTTP.OK, 'OTP sent successfully', {
    otp: result.otpCode, // return in response so developers can easily test
  });
});

/**
 * Handle OTP verification.
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  await authService.verifyOtp(mobile, otp);

  return sendSuccess(res, HTTP.OK, 'OTP verified successfully');
});

/**
 * Handle password resetting via OTP code.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { mobile, otp, newPassword } = req.body;

  await authService.resetPassword(mobile, otp, newPassword);

  return sendSuccess(res, HTTP.OK, 'Password reset successful');
});

/**
 * Handle password changes for logged-in users.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword } = req.body;

  await authService.changePassword(userId, oldPassword, newPassword);

  // Clear cookie to force re-login
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return sendSuccess(res, HTTP.OK, 'Password changed successfully. Please login again.');
});

/**
 * Retrieve user profile.
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const profile = await authService.getProfile(userId);

  return sendSuccess(res, HTTP.OK, 'Profile retrieved successfully', profile);
});

/**
 * Update user profile details.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fullName, gender, profileImageUrl, address } = req.body;

  const updatedProfile = await authService.updateProfile(userId, {
    fullName,
    gender,
    profileImageUrl,
    address,
  });

  return sendSuccess(res, HTTP.OK, 'Profile updated successfully', updatedProfile);
});
