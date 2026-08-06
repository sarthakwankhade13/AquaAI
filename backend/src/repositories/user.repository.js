import { pool } from '../config/db.js';

/**
 * Data access layer for the `users` table.
 * All queries are parameterised to prevent SQL Injection.
 */

/**
 * Finds a user by mobile number.
 * @param {string} mobile
 * @returns {Promise<object|null>} User row or null
 */
export const findByMobile = async (mobile) => {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.role_id, r.role_name, u.full_name, u.email, u.mobile, u.password, 
            u.gender, u.profile_image_url, u.address, u.is_verified, u.is_active, u.last_login 
     FROM users u
     INNER JOIN roles r ON u.role_id = r.role_id
     WHERE u.mobile = ? LIMIT 1`,
    [mobile]
  );
  return rows[0] || null;
};

/**
 * Finds a user by user_id.
 * @param {number} userId
 * @returns {Promise<object|null>} User row (excluding password) or null
 */
export const findById = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.role_id, r.role_name, u.full_name, u.email, u.mobile, 
            u.gender, u.profile_image_url, u.address, u.is_verified, u.is_active, u.last_login 
     FROM users u
     INNER JOIN roles r ON u.role_id = r.role_id
     WHERE u.user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * Updates the last login timestamp for a user.
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const updateLastLogin = async (userId) => {
  await pool.execute(
    'UPDATE users SET last_login = NOW() WHERE user_id = ?',
    [userId]
  );
};

/**
 * Updates a user's password.
 * @param {number} userId
 * @param {string} hashedPassword
 * @returns {Promise<void>}
 */
export const updatePassword = async (userId, hashedPassword) => {
  await pool.execute(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
    [hashedPassword, userId]
  );
};

/**
 * Updates a user's profile details.
 * @param {number} userId
 * @param {object} profileData
 * @returns {Promise<void>}
 */
export const updateProfile = async (userId, { fullName, gender, profileImageUrl, address }) => {
  await pool.execute(
    `UPDATE users 
     SET full_name = ?, gender = ?, profile_image_url = ?, address = ?, updated_at = NOW() 
     WHERE user_id = ?`,
    [fullName, gender, profileImageUrl, address, userId]
  );
};
