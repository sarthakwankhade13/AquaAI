'use strict';

const { pool } = require('../config/db');

/**
 * Data access layer for the `audit_logs` table.
 * Records security-sensitive events (login, logout, etc.)
 */

/**
 * Creates an audit log entry.
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.action - e.g. 'LOGIN', 'LOGOUT', 'TOKEN_REFRESH'
 * @param {string} params.module - e.g. 'AUTH'
 * @param {string} params.description - Human-readable description
 * @param {string|null} params.ipAddress - Client IP address
 * @param {string|null} params.userAgent - Client user-agent string
 */
const log = async ({ userId, action, module, description, ipAddress = null, userAgent = null }) => {
  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, module, description, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, action, module, description, ipAddress, userAgent]
  );
};

module.exports = { log };
