import bcrypt from 'bcryptjs';
import env from '../config/env.js';

/**
 * Hashes a plaintext password using bcryptjs.
 * @param {string} password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const saltRounds = env.bcrypt.saltRounds || 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plaintext password with a hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>} Match status
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
