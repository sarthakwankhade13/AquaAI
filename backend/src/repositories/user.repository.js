'use strict';

const { pool } = require('../config/db');

/**
 * Data access layer for the `users` table.
 * All queries are parameterised — no string interpolation.
 */

/**
 * Finds a user by email address.
 * @param {string} email
 * @returns {object|null} User row or null
 */
const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password, role, status, last_login, created_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

/**
 * Finds a user by primary key.
 * @param {number} id
 * @returns {object|null} User row (password excluded) or null
 */
const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, status, phone, designation, last_login, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

/**
 * Updates the last_login timestamp after a successful login.
 * @param {number} id
 */
const updateLastLogin = async (id) => {
  await pool.execute(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [id]
  );
};

module.exports = { findByEmail, findById, updateLastLogin };
