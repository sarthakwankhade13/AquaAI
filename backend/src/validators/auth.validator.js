import { body } from 'express-validator';

/**
 * Validation rules for the Authentication module.
 */

export const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .isNumeric().withMessage('Mobile number must contain digits only')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('roleId')
    .notEmpty().withMessage('Account type is required')
    .isInt({ min: 1 }).withMessage('Account type must be a valid role ID'),
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  body('organization')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Organization name cannot exceed 255 characters'),
  body('designation')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Designation cannot exceed 255 characters'),
];

export const loginValidator = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .isNumeric().withMessage('Mobile number must contain digits only')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

export const sendOtpValidator = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .isNumeric().withMessage('Mobile number must contain digits only')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits')
];

export const verifyOtpValidator = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .isNumeric().withMessage('Mobile number must contain digits only')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isNumeric().withMessage('OTP must be numeric')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
];

export const resetPasswordValidator = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .isNumeric().withMessage('Mobile number must contain digits only')
    .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isNumeric().withMessage('OTP must be numeric')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

export const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password cannot be the same as the current password');
      }
      return true;
    })
];

export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('profileImageUrl')
    .optional()
    .trim()
    .isURL().withMessage('Profile image URL must be a valid URL'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters')
];
