import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateFields } from '../middlewares/validation.middleware.js';
import {
  loginValidator,
  sendOtpValidator,
  verifyOtpValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} from '../validators/auth.validator.js';

const router = Router();

// ─── Public Endpoints ─────────────────────────────────────────────────────────

// Login route
router.post('/login', loginValidator, validateFields, authController.login);

// Refresh access token route
router.post('/refresh-token', authController.refresh);

// Forgot Password route (triggers OTP send)
router.post('/forgot-password', sendOtpValidator, validateFields, authController.sendOtp);

// Send OTP route
router.post('/send-otp', sendOtpValidator, validateFields, authController.sendOtp);

// Verify OTP route
router.post('/verify-otp', verifyOtpValidator, validateFields, authController.verifyOtp);

// Reset Password route
router.post('/reset-password', resetPasswordValidator, validateFields, authController.resetPassword);

// ─── Protected Endpoints ──────────────────────────────────────────────────────

// Logout route
router.post('/logout', verifyJWT, authController.logout);

// Change Password route
router.post('/change-password', verifyJWT, changePasswordValidator, validateFields, authController.changePassword);

// Get profile details
router.get('/profile', verifyJWT, authController.getProfile);

// Update profile details
router.put('/profile', verifyJWT, updateProfileValidator, validateFields, authController.updateProfile);

export default router;
