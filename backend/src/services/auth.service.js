import { AppError } from '../utils/customError.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  expiryToMs,
} from '../utils/jwt.utils.js';
import { generateNumericOtp, getOtpExpiryDate } from '../utils/otp.utils.js';
import * as authRepo from '../repositories/auth.repository.js';
import jwtConfig from '../config/jwt.js';
import HTTP from '../constants/httpStatus.js';

/**
 * Service Layer for the Authentication Module.
 */

/**
 * Registers a new user account.
 *
 * @param {object} userData - { fullName, email, mobile, password, gender, roleId, address }
 * @returns {Promise<object>} Safe user object (no password)
 */
export const register = async ({ fullName, email, mobile, password, gender, roleId, address }) => {
  // Check for duplicate email
  const existingEmail = await authRepo.findUserByEmail(email);
  if (existingEmail) {
    throw new AppError('An account with this email address already exists.', HTTP.CONFLICT);
  }

  // Check for duplicate mobile
  const existingMobile = await authRepo.findUserByMobile(mobile);
  if (existingMobile) {
    throw new AppError('An account with this mobile number already exists.', HTTP.CONFLICT);
  }

  // Hash password before storing
  const hashedPassword = await hashPassword(password);

  // Persist new user
  const newUserId = await authRepo.createUser({
    fullName,
    email,
    mobile,
    hashedPassword,
    gender,
    roleId,
    address,
  });

  // Return the newly created user (without password)
  const user = await authRepo.findUserById(newUserId);
  return user;
};

/**
 * Log in user using mobile and password.
 * 
 * @param {string} mobile
 * @param {string} password
 * @param {object} meta - User agent details (ipAddress, deviceInfo, browser, operatingSystem)
 * @returns {Promise<object>} { accessToken, refreshToken, user }
 */
export const login = async (mobile, password, meta = {}) => {
  const user = await authRepo.findUserByMobile(mobile);
  
  if (!user) {
    throw new AppError('Invalid mobile number or password', HTTP.UNAUTHORIZED);
  }

  // Check account activity
  if (!user.is_active) {
    // Record failed login
    await authRepo.insertLoginHistory({
      userId: user.user_id,
      ipAddress: meta.ipAddress,
      deviceInfo: meta.deviceInfo,
      browser: meta.browser,
      operatingSystem: meta.operatingSystem,
      loginStatus: 'FAILED',
    });
    throw new AppError('Your account has been deactivated. Please contact an administrator.', HTTP.UNAUTHORIZED);
  }

  // Compare passwords
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    // Record failed login
    await authRepo.insertLoginHistory({
      userId: user.user_id,
      ipAddress: meta.ipAddress,
      deviceInfo: meta.deviceInfo,
      browser: meta.browser,
      operatingSystem: meta.operatingSystem,
      loginStatus: 'FAILED',
    });
    throw new AppError('Invalid mobile number or password', HTTP.UNAUTHORIZED);
  }

  // Build token payload
  const tokenPayload = {
    userId: user.user_id,
    email: user.email,
    role: user.role_name,
  };

  // Sign tokens
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Store refresh token
  const expiresAt = new Date(Date.now() + expiryToMs(jwtConfig.refresh.expiresIn));
  await authRepo.saveRefreshToken(user.user_id, refreshToken, expiresAt);

  // Update last login timestamp
  await authRepo.updateUserLastLogin(user.user_id);

  // Record successful login in history
  await authRepo.insertLoginHistory({
    userId: user.user_id,
    ipAddress: meta.ipAddress,
    deviceInfo: meta.deviceInfo,
    browser: meta.browser,
    operatingSystem: meta.operatingSystem,
    loginStatus: 'SUCCESS',
  });

  // Extract safe user object (omit password)
  const { password: _, ...safeUser } = user;

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
};

/**
 * Log out user by revoking tokens and recording the event in history.
 * 
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const logout = async (userId) => {
  // Revoke/Delete refresh tokens
  await authRepo.deleteRefreshTokensByUserId(userId);

  // Update last login history item with logout time
  await authRepo.updateLoginHistoryLogout(userId);
};

/**
 * Validates a refresh token and returns a new access + rotated refresh token.
 * 
 * @param {string} incomingRefreshToken
 * @returns {Promise<object>} { accessToken, refreshToken }
 */
export const refreshAccessToken = async (incomingRefreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please login again.', HTTP.UNAUTHORIZED);
  }

  // Fetch refresh token record from DB
  const stored = await authRepo.findRefreshToken(incomingRefreshToken);
  if (!stored) {
    throw new AppError('Session not found. Please login again.', HTTP.UNAUTHORIZED);
  }

  // Verify if revoked
  if (stored.is_revoked) {
    // If a revoked token is presented, suspect reuse hijacking and clear all tokens for the user
    await authRepo.deleteRefreshTokensByUserId(stored.user_id);
    throw new AppError('Compromised session. Please login again.', HTTP.UNAUTHORIZED);
  }

  // Check database expiration
  if (new Date(stored.expires_at) < new Date()) {
    await authRepo.deleteRefreshTokensByUserId(stored.user_id);
    throw new AppError('Session expired. Please login again.', HTTP.UNAUTHORIZED);
  }

  // Perform rotation: revoke the old refresh token
  await authRepo.revokeRefreshToken(incomingRefreshToken);

  // Get user details to construct new tokens
  const user = await authRepo.findUserById(decoded.userId);
  if (!user || !user.is_active) {
    throw new AppError('User inactive or not found', HTTP.UNAUTHORIZED);
  }

  const tokenPayload = {
    userId: user.user_id,
    email: user.email,
    role: user.role_name,
  };

  // Sign new set of tokens
  const newAccessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken(tokenPayload);

  // Save the new refresh token in DB
  const expiresAt = new Date(Date.now() + expiryToMs(jwtConfig.refresh.expiresIn));
  await authRepo.saveRefreshToken(user.user_id, newRefreshToken, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Generates and saves an OTP to reset password.
 * 
 * @param {string} mobile
 * @returns {Promise<object>} { otpCode, userId }
 */
export const sendOtp = async (mobile) => {
  const user = await authRepo.findUserByMobile(mobile);
  if (!user) {
    throw new AppError('Mobile number is not registered', HTTP.NOT_FOUND);
  }

  if (!user.is_active) {
    throw new AppError('User account is deactivated', HTTP.FORBIDDEN);
  }

  // Generate 6-digit numeric OTP and set expiry (5 minutes validity)
  const otpCode = generateNumericOtp();
  const expiresAt = getOtpExpiryDate(5);

  // Save OTP in database
  await authRepo.insertOtp(user.user_id, otpCode, expiresAt);

  // In a real application, you would trigger SMS gateway API here.
  // We return the OTP code in response for testing/development.
  return {
    otpCode,
    userId: user.user_id,
  };
};

/**
 * Verifies an OTP code for a given mobile number.
 * 
 * @param {string} mobile
 * @param {string} otpCode
 * @returns {Promise<boolean>} True if valid
 */
export const verifyOtp = async (mobile, otpCode) => {
  const user = await authRepo.findUserByMobile(mobile);
  if (!user) {
    throw new AppError('Mobile number is not registered', HTTP.NOT_FOUND);
  }

  const activeOtp = await authRepo.findActiveOtp(user.user_id, otpCode);
  if (!activeOtp) {
    throw new AppError('Invalid or expired OTP', HTTP.BAD_REQUEST);
  }

  return true;
};

/**
 * Resets a password using OTP verification.
 * 
 * @param {string} mobile
 * @param {string} otpCode
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const resetPassword = async (mobile, otpCode, newPassword) => {
  const user = await authRepo.findUserByMobile(mobile);
  if (!user) {
    throw new AppError('Mobile number is not registered', HTTP.NOT_FOUND);
  }

  const activeOtp = await authRepo.findActiveOtp(user.user_id, otpCode);
  if (!activeOtp) {
    throw new AppError('Invalid or expired OTP', HTTP.BAD_REQUEST);
  }

  // Mark OTP as used
  await authRepo.markOtpAsUsed(activeOtp.otp_id);

  // Hash new password and save
  const hashedPassword = await hashPassword(newPassword);
  await authRepo.updateUserPassword(user.user_id, hashedPassword);

  // Revoke all existing sessions for the user after password reset for security
  await authRepo.deleteRefreshTokensByUserId(user.user_id);
};

/**
 * Changes password of an authenticated user.
 * 
 * @param {number} userId
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  // Fetch user with password since the standard findUserById omits password
  const user = await authRepo.findUserByMobile((await authRepo.findUserById(userId)).mobile);
  if (!user) {
    throw new AppError('User not found', HTTP.NOT_FOUND);
  }

  // Verify old password
  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError('Incorrect current password', HTTP.BAD_REQUEST);
  }

  // Hash and save new password
  const hashedPassword = await hashPassword(newPassword);
  await authRepo.updateUserPassword(userId, hashedPassword);

  // Invalidate refresh tokens on password change to force re-login on other devices
  await authRepo.deleteRefreshTokensByUserId(userId);
};

/**
 * Retrieves the profile details of a user.
 * 
 * @param {number} userId
 * @returns {Promise<object>} User details
 */
export const getProfile = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', HTTP.NOT_FOUND);
  }
  return user;
};

/**
 * Updates the user's profile details.
 * 
 * @param {number} userId
 * @param {object} updateData - { fullName, gender, profileImageUrl, address }
 * @returns {Promise<object>} Updated user profile
 */
export const updateProfile = async (userId, updateData) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', HTTP.NOT_FOUND);
  }

  // Merge updates with existing values to support partial updates
  const profilePayload = {
    fullName: updateData.fullName !== undefined ? updateData.fullName : user.full_name,
    gender: updateData.gender !== undefined ? updateData.gender : user.gender,
    profileImageUrl: updateData.profileImageUrl !== undefined ? updateData.profileImageUrl : user.profile_image_url,
    address: updateData.address !== undefined ? updateData.address : user.address,
  };

  await authRepo.updateUserProfile(userId, profilePayload);

  // Return the freshly updated profile record
  return authRepo.findUserById(userId);
};
