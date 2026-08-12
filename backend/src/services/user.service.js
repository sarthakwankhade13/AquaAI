import {
    getUsers,
    getUserStats,
    getRoles,
    findById,
} from '../repositories/user.repository.js';

/**
 * User Management Service
 *
 * Business logic layer between controllers and repository.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Get Users
// ─────────────────────────────────────────────────────────────────────────────

export const listUsers = async ({
    page = 1,
    limit = 10,
    search = '',
    roleId = null,
    status = null,
}) => {
    // Normalize pagination
    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

    // Convert status query into boolean
    let isActive = null;

    if (status === 'active') {
        isActive = true;
    } else if (status === 'inactive') {
        isActive = false;
    }

    const result = await getUsers({
        page: currentPage,
        limit: perPage,
        search: String(search || '').trim(),
        roleId: roleId || null,
        isActive,
    });

    const totalPages = Math.ceil(result.total / perPage);

    return {
        users: result.users,
        pagination: {
            page: currentPage,
            limit: perPage,
            total: result.total,
            totalPages,
        },
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// Get User By ID
// ─────────────────────────────────────────────────────────────────────────────

export const getUserById = async (userId) => {
    if (!userId) {
        const error = new Error('User ID is required');
        error.statusCode = 400;
        throw error;
    }

    const user = await findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// Get User Statistics
// ─────────────────────────────────────────────────────────────────────────────

export const getStatistics = async () => {
    return await getUserStats();
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Roles
// ─────────────────────────────────────────────────────────────────────────────

export const listRoles = async () => {
    return await getRoles();
};