'use strict';

const { body } = require('express-validator');

/**
 * Validation rules for POST /auth/login
 */
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

/**
 * Validation rules for POST /auth/refresh-token
 */
const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string'),
];

module.exports = { loginValidator, refreshTokenValidator };
