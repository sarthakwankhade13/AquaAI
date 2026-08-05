'use strict';

const { pool } = require('../config/db');

/**
 * Data access layer for the `refresh_tokens` table.
 * Tokens are stored hashed; plain tokens never touch the DB.
 */

/**
 * Saves a hashed refresh token for a user session.
 * Deletes any existing token first to enforce single-session per user.
 * @param {number} userId
 * @param {string} hashedToken - bcrypt hash of the refresh token
 * @param {Date} expiresAt - Token expiry datetime
 */
const save = async (userId, hashedToken, expiresAt) => {
  // Enforce single active session per user
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, hashedToken, expiresAt]
  );
};

/**
 * Retrieves the stored refresh token record for a user.
 * @param {number} userId
 * @returns {object|null}
 */
const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id, token_hash, expires_at FROM refresh_tokens WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
};

/**
 * Deletes the refresh token for a user (logout / revoke).
 * @param {number} userId
 */
const deleteByUserId = async (userId) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

module.exports = { save, findByUserId, deleteByUserId };
