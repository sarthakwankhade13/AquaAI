'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginValidator, refreshTokenValidator } = require('../validators/auth.validator');

// POST /api/v1/auth/login
router.post('/login', loginValidator, validate, authController.login);

// POST /api/v1/auth/logout  (protected)
router.post('/logout', authenticate, authController.logout);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);

// GET /api/v1/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
