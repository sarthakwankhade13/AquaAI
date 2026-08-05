import dotenv from 'dotenv';
dotenv.config();

/**
 * env.js — Centralised Environment Configuration
 *
 * Single source of truth for all environment variables.
 * Validates required variables at startup so the app fails fast
 * instead of crashing at runtime with a cryptic error.
 *
 * Usage: import env from './config/env.js'
 */

const _required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`[ENV] Missing required variable: ${key}`);
  return value;
};

const _optional = (key, fallback) => process.env[key] ?? fallback;

const env = {
  // ─── Server ──────────────────────────────────────────────────
  NODE_ENV : _optional('NODE_ENV', 'development'),
  PORT     : parseInt(_optional('PORT', '5000'), 10),

  // ─── MySQL ───────────────────────────────────────────────────
  db: {
    host    : _required('DB_HOST'),
    port    : parseInt(_optional('DB_PORT', '3306'), 10),
    user    : _required('DB_USER'),
    password: _required('DB_PASSWORD'),
    name    : _required('DB_NAME'),
  },

  // ─── JWT (used in Auth module) ───────────────────────────────
  jwt: {
    accessSecret    : _optional('JWT_ACCESS_SECRET', 'change_me_access'),
    refreshSecret   : _optional('JWT_REFRESH_SECRET', 'change_me_refresh'),
    accessExpiresIn : _optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: _optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // ─── Bcrypt ──────────────────────────────────────────────────
  bcrypt: {
    saltRounds: parseInt(_optional('BCRYPT_SALT_ROUNDS', '12'), 10),
  },

  // ─── Rate Limiting ───────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(_optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max     : parseInt(_optional('RATE_LIMIT_MAX', '100'), 10),
  },

  // ─── CORS ────────────────────────────────────────────────────
  cors: {
    origin: _optional('CORS_ORIGIN', 'http://localhost:3000'),
  },

  // ─── Helpers ─────────────────────────────────────────────────
  get isDev()  { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production';  },
  get isTest() { return this.NODE_ENV === 'test';        },
};

export default env;
