import { pool } from '../config/db.js';

/**
 * User Repository
 *
 * Database access layer for User Management.
 *
 * IMPORTANT:
 * Only columns confirmed to exist in the current
 * AquaAI authentication implementation are used here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Common SELECT
// ─────────────────────────────────────────────────────────────────────────────

const USER_SELECT = `
  SELECT
    u.user_id,
    u.role_id,
    r.role_name,
    u.full_name,
    u.email,
    u.mobile,
    u.gender,
    u.profile_image_url,
    u.address,
    u.is_verified,
    u.is_active,
    u.last_login,
    u.created_at,
    u.updated_at
  FROM users u
  INNER JOIN roles r ON u.role_id = r.role_id
`;

// ─────────────────────────────────────────────────────────────────────────────
// Get Users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated users with optional search, role and status filters.
 *
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} options.search
 * @param {number|string|null} options.roleId
 * @param {boolean|null} options.isActive
 *
 * @returns {Promise<{users: Array, total: number}>}
 */
export const getUsers = async ({
  page = 1,
  limit = 10,
  search = '',
  roleId = null,
  isActive = null,
}) => {
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  // Search by name, email or mobile
  if (search) {
    conditions.push(`
      (
        u.full_name LIKE ?
        OR u.email LIKE ?
        OR u.mobile LIKE ?
      )
    `);

    const searchValue = `%${search}%`;

    params.push(searchValue, searchValue, searchValue);
  }

  // Role filter
  if (roleId !== null && roleId !== undefined && roleId !== '') {
    conditions.push('u.role_id = ?');
    params.push(roleId);
  }

  // Active / inactive filter
  if (isActive !== null && isActive !== undefined) {
    conditions.push('u.is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

  // Get users
  const [users] = await pool.execute(
    `
      ${USER_SELECT}
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), Number(offset)]
  );

  // Get total count
  const [countRows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN roles r ON u.role_id = r.role_id
      ${whereClause}
    `,
    params
  );

  return {
    users,
    total: Number(countRows[0]?.total || 0),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Get User By ID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a user by ID.
 *
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export const findById = async (userId) => {
  const [rows] = await pool.execute(
    `
      ${USER_SELECT}
      WHERE u.user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// User Statistics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get User Management dashboard statistics.
 *
 * The role names are read from the roles table instead of
 * hard-coding role IDs.
 *
 * @returns {Promise<object>}
 */
export const getUserStats = async () => {
  const [rows] = await pool.execute(`
    SELECT
      COUNT(*) AS totalUsers,

      SUM(
        CASE
          WHEN LOWER(r.role_name) IN ('district_admin', 'district admin')
          THEN 1
          ELSE 0
        END
      ) AS districtAdmins,

      SUM(
        CASE
          WHEN LOWER(r.role_name) IN ('village_officer', 'village officer', 'operator')
          THEN 1
          ELSE 0
        END
      ) AS villageOfficers,

      SUM(
        CASE
          WHEN LOWER(r.role_name) IN ('driver', 'tanker_driver', 'tanker driver')
          THEN 1
          ELSE 0
        END
      ) AS drivers,

      SUM(
        CASE
          WHEN LOWER(r.role_name) = 'citizen'
          THEN 1
          ELSE 0
        END
      ) AS citizens

    FROM users u
    INNER JOIN roles r ON u.role_id = r.role_id
  `);

  const stats = rows[0] || {};

  return {
    totalUsers: Number(stats.totalUsers || 0),
    districtAdmins: Number(stats.districtAdmins || 0),
    villageOfficers: Number(stats.villageOfficers || 0),
    drivers: Number(stats.drivers || 0),
    citizens: Number(stats.citizens || 0),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Roles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all available roles.
 *
 * This will later be used by the Add User / Edit User forms.
 *
 * @returns {Promise<Array>}
 */
export const getRoles = async () => {
  const [rows] = await pool.execute(`
    SELECT
      role_id,
      role_name
    FROM roles
    ORDER BY role_name ASC
  `);

  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// Existing Authentication Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds a user by mobile number.
 *
 * Used by authentication.
 */
export const findByMobile = async (mobile) => {
  const [rows] = await pool.execute(
    `
      SELECT
        u.user_id,
        u.role_id,
        r.role_name,
        u.full_name,
        u.email,
        u.mobile,
        u.password,
        u.gender,
        u.profile_image_url,
        u.address,
        u.is_verified,
        u.is_active,
        u.last_login
      FROM users u
      INNER JOIN roles r ON u.role_id = r.role_id
      WHERE u.mobile = ?
      LIMIT 1
    `,
    [mobile]
  );

  return rows[0] || null;
};

/**
 * Updates the last login timestamp.
 */
export const updateLastLogin = async (userId) => {
  await pool.execute(
    'UPDATE users SET last_login = NOW() WHERE user_id = ?',
    [userId]
  );
};

/**
 * Updates a user's password.
 */
export const updatePassword = async (userId, hashedPassword) => {
  await pool.execute(
    `
      UPDATE users
      SET password = ?, updated_at = NOW()
      WHERE user_id = ?
    `,
    [hashedPassword, userId]
  );
};

/**
 * Updates a user's profile details.
 */
export const updateProfile = async (
  userId,
  { fullName, gender, profileImageUrl, address }
) => {
  await pool.execute(
    `
      UPDATE users
      SET
        full_name = ?,
        gender = ?,
        profile_image_url = ?,
        address = ?,
        updated_at = NOW()
      WHERE user_id = ?
    `,
    [
      fullName,
      gender,
      profileImageUrl,
      address,
      userId,
    ]
  );
};