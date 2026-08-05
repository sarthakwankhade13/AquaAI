/**
 * jwt.js — JWT Token Configuration
 *
 * Pulls JWT secrets and expiry values from env.
 * Imported by the Auth module (tokenHelper, auth.service).
 * Kept in config layer so secrets are never hardcoded in business logic.
 *
 * Usage: import jwtConfig from './config/jwt.js'
 */

import env from './env.js';

const jwtConfig = {
  access: {
    secret   : env.jwt.accessSecret,
    expiresIn: env.jwt.accessExpiresIn,   // e.g. '15m'
  },
  refresh: {
    secret   : env.jwt.refreshSecret,
    expiresIn: env.jwt.refreshExpiresIn,  // e.g. '7d'
  },
};

export default jwtConfig;
