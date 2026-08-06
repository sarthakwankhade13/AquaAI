import { pool } from '../config/db.js';

/**
 * Data Access Layer for the Authentication module.
 * Targets users, roles, refresh_tokens, login_history, and password_reset_otp tables.
 */

// ─── User Queries ─────────────────────────────────────────────────────────────

/**
 * Finds a user by mobile number.
 * @param {string} mobile
 * @returns {Promise<object|null>} User record with role_name or null
 */
export const findUserByMobile = async (mobile) => {
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
 * @returns {Promise<object|null>} User record without password or null
 */
export const findUserById = async (userId) => {
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
 * Updates a user's last login timestamp.
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const updateUserLastLogin = async (userId) => {
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
export const updateUserPassword = async (userId, hashedPassword) => {
  await pool.execute(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
    [hashedPassword, userId]
  );
};

/**
 * Updates a user's profile details.
 * @param {number} userId
 * @param {object} profileDetails
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, { fullName, gender, profileImageUrl, address }) => {
  await pool.execute(
    `UPDATE users 
     SET full_name = ?, gender = ?, profile_image_url = ?, address = ?, updated_at = NOW() 
     WHERE user_id = ?`,
    [fullName, gender, profileImageUrl, address, userId]
  );
};

// ─── Refresh Token Queries ────────────────────────────────────────────────────

/**
 * Saves a refresh token. Revokes previous tokens for the user to maintain a single session.
 * @param {number} userId
 * @param {string} token
 * @param {Date} expiresAt
 * @returns {Promise<void>}
 */
export const saveRefreshToken = async (userId, token, expiresAt) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, refresh_token, expires_at, is_revoked) VALUES (?, ?, ?, 0)',
    [userId, token, expiresAt]
  );
};

/**
 * Finds a refresh token.
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export const findRefreshToken = async (token) => {
  const [rows] = await pool.execute(
    'SELECT token_id, user_id, refresh_token, expires_at, is_revoked FROM refresh_tokens WHERE refresh_token = ? LIMIT 1',
    [token]
  );
  return rows[0] || null;
};

/**
 * Revokes a refresh token.
 * @param {string} token
 * @returns {Promise<void>}
 */
export const revokeRefreshToken = async (token) => {
  await pool.execute(
    'UPDATE refresh_tokens SET is_revoked = 1 WHERE refresh_token = ?',
    [token]
  );
};

/**
 * Deletes all refresh tokens for a user.
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const deleteRefreshTokensByUserId = async (userId) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

// ─── Login History Queries ───────────────────────────────────────────────────

/**
 * Inserts a login attempt record.
 * @param {object} params
 * @returns {Promise<void>}
 */
export const insertLoginHistory = async ({ userId, ipAddress, deviceInfo, browser, operatingSystem, loginStatus }) => {
  await pool.execute(
    `INSERT INTO login_history 
     (user_id, login_time, ip_address, device_info, browser, operating_system, login_status, created_at)
     VALUES (?, NOW(), ?, ?, ?, ?, ?, NOW())`,
    [userId, ipAddress, deviceInfo, browser, operatingSystem, loginStatus]
  );
};

/**
 * Updates the logout timestamp for the most recent active login of a user.
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const updateLoginHistoryLogout = async (userId) => {
  await pool.execute(
    `UPDATE login_history 
     SET logout_time = NOW(), login_status = 'LOGOUT' 
     WHERE user_id = ? AND login_status = 'SUCCESS' AND logout_time IS NULL 
     ORDER BY login_time DESC LIMIT 1`,
    [userId]
  );
};

// ─── OTP Queries ──────────────────────────────────────────────────────────────

/**
 * Inserts an OTP record for a user and marks previous active OTPs as used.
 * @param {number} userId
 * @param {string} otpCode
 * @param {Date} expiresAt
 * @returns {Promise<void>}
 */
export const insertOtp = async (userId, otpCode, expiresAt) => {
  await pool.execute(
    'UPDATE password_reset_otp SET is_used = 1 WHERE user_id = ? AND is_used = 0',
    [userId]
  );

  await pool.execute(
    'INSERT INTO password_reset_otp (user_id, otp_code, expires_at, is_used) VALUES (?, ?, ?, 0)',
    [userId, otpCode, expiresAt]
  );
};

/**
 * Finds an active (unused and unexpired) OTP.
 * @param {number} userId
 * @param {string} otpCode
 * @returns {Promise<object|null>} OTP record or null
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
export const markOtpAsUsed = async (otpId) => {
  await pool.execute(
    'UPDATE password_reset_otp SET is_used = 1 WHERE otp_id = ?',
    [otpId]
  );
};
