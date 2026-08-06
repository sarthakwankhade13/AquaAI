import { pool } from '../config/db.js';

/**
 * Data access layer for the `password_reset_otp` table.
 */

/**
 * Saves a new OTP code for a user. Inactivates any previous OTPs for this user.
 * @param {number} userId
 * @param {string} otpCode
 * @param {Date} expiresAt
 * @returns {Promise<void>}
 */
export const createOtp = async (userId, otpCode, expiresAt) => {
  // Invalidate any existing unused OTPs for the user
  await pool.execute(
    'UPDATE password_reset_otp SET is_used = 1 WHERE user_id = ? AND is_used = 0',
    [userId]
  );

  // Insert the new OTP
  await pool.execute(
    'INSERT INTO password_reset_otp (user_id, otp_code, expires_at, is_used) VALUES (?, ?, ?, 0)',
    [userId, otpCode, expiresAt]
  );
};

/**
 * Finds an active, unexpired, and unused OTP for a user.
 * @param {number} userId
 * @param {string} otpCode
 * @returns {Promise<object|null>} OTP row or null
 */
export const findActiveOtp = async (userId, otpCode) => {
  const [rows] = await pool.execute(
    `SELECT otp_id, user_id, otp_code, expires_at, is_used 
     FROM password_reset_otp 
     WHERE user_id = ? AND otp_code = ? AND is_used = 0 AND expires_at > NOW() 
     LIMIT 1`,
    [userId, otpCode]
  );
  return rows[0] || null;
};

/**
 * Marks an OTP as used.
 * @param {number} otpId
 * @returns {Promise<void>}
 */
export const markAsUsed = async (otpId) => {
  await pool.execute(
    'UPDATE password_reset_otp SET is_used = 1 WHERE otp_id = ?',
    [otpId]
  );
};
