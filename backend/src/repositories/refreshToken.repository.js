import { pool } from '../config/db.js';

/**
 * Data access layer for the `refresh_tokens` table.
 */

/**
 * Saves a refresh token for a user session.
 * Enforces single session per user by deleting existing tokens first.
 * @param {number} userId
 * @param {string} token - The refresh token string
 * @param {Date} expiresAt - Expiry datetime
 * @returns {Promise<void>}
 */
export const save = async (userId, token, expiresAt) => {
  // Enforce single active session per user
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, refresh_token, expires_at, is_revoked) VALUES (?, ?, ?, 0)',
    [userId, token, expiresAt]
  );
};

/**
 * Finds a refresh token record.
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export const findByToken = async (token) => {
  const [rows] = await pool.execute(
    'SELECT token_id, user_id, refresh_token, expires_at, is_revoked, created_at FROM refresh_tokens WHERE refresh_token = ? LIMIT 1',
    [token]
  );
  return rows[0] || null;
};

/**
 * Revokes a specific refresh token.
 * @param {string} token
 * @returns {Promise<void>}
 */
export const revokeToken = async (token) => {
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
export const deleteByUserId = async (userId) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};
