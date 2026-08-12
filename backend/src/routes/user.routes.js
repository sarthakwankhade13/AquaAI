import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import {
    verifyJWT,
    authorizeRoles,
} from '../middlewares/auth.middleware.js';
import ROLES from '../constants/roles.js';

const router = Router();

/*
 * User Management Routes
 *
 * All routes require:
 * 1. Valid JWT
 * 2. WRD Super Admin role
 *
 * Base URL:
 * /api/v1/users
 */

// ─────────────────────────────────────────────────────────────────────────────
// Get User Statistics
// GET /api/v1/users/stats
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/stats',
    verifyJWT,
    authorizeRoles(ROLES.WRD_ADMIN),
    userController.getUserStatistics
);

// ─────────────────────────────────────────────────────────────────────────────
// Get Available Roles
// GET /api/v1/users/roles
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/roles',
    verifyJWT,
    authorizeRoles(ROLES.WRD_ADMIN),
    userController.getUserRoles
);

// ─────────────────────────────────────────────────────────────────────────────
// Get Users
// GET /api/v1/users
//
// Query parameters:
// ?page=1
// &limit=10
// &search=Rajesh
// &roleId=2
// &status=active
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/',
    verifyJWT,
    authorizeRoles(ROLES.WRD_ADMIN),
    userController.getUsers
);

// ─────────────────────────────────────────────────────────────────────────────
// Get Single User
// GET /api/v1/users/:id
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/:id',
    verifyJWT,
    authorizeRoles(ROLES.WRD_ADMIN),
    userController.getUser
);

export default router;