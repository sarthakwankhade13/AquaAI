import { pool } from '../config/db.js';

/**
 * Data access layer for the `login_history` table.
 */

/**
 * Creates a login history record.
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.ipAddress
 * @param {string} params.deviceInfo
 * @param {string} params.browser
 * @param {string} params.operatingSystem
 * @param {string} params.loginStatus - 'SUCCESS' | 'FAILED' | 'LOGOUT'
 * @returns {Promise<void>}
 */
export const createEntry = async ({ userId, ipAddress, deviceInfo, browser, operatingSystem, loginStatus }) => {
  await pool.execute(
    `INSERT INTO login_history 
     (user_id, login_time, ip_address, device_info, browser, operating_system, login_status, created_at)
     VALUES (?, NOW(), ?, ?, ?, ?, ?, NOW())`,
    [userId, ipAddress, deviceInfo, browser, operatingSystem, loginStatus]
  );
};

/**
 * Updates the logout timestamp for the latest active login record of a user.
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const updateLogoutTime = async (userId) => {
  // Find the most recent active login history for the user and mark it as logout
  await pool.execute(
    `UPDATE login_history 
     SET logout_time = NOW(), login_status = 'LOGOUT' 
     WHERE user_id = ? AND login_status = 'SUCCESS' AND logout_time IS NULL 
     ORDER BY login_time DESC LIMIT 1`,
    [userId]
  );
};
