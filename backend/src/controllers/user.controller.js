import {
    listUsers,
    getUserById,
    getStatistics,
    listRoles,
} from '../services/user.service.js';

/**
 * User Management Controller
 *
 * Handles HTTP requests for User Management.
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /users
// ─────────────────────────────────────────────────────────────────────────────

export const getUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            roleId = null,
            status = null,
        } = req.query;

        const result = await listUsers({
            page,
            limit,
            search,
            roleId,
            status,
        });

        return res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data: result.users,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await getUserById(id);

        return res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/stats
// ─────────────────────────────────────────────────────────────────────────────

export const getUserStatistics = async (req, res, next) => {
    try {
        const statistics = await getStatistics();

        return res.status(200).json({
            success: true,
            message: 'User statistics fetched successfully',
            data: statistics,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/roles
// ─────────────────────────────────────────────────────────────────────────────

export const getUserRoles = async (req, res, next) => {
    try {
        const roles = await listRoles();

        return res.status(200).json({
            success: true,
            message: 'Roles fetched successfully',
            data: roles,
        });
    } catch (error) {
        next(error);
    }
};