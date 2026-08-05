/**
 * logger.js — Application Logger (Winston)
 *
 * Unified logger used across the entire application.
 * - Development: colourised console output + timestamps
 * - Production : structured JSON logs to files
 * - Test       : console suppressed
 *
 * Log files:
 *   src/logs/error.log    — error level only
 *   src/logs/combined.log — all levels
 *
 * Usage: import logger from '../utils/logger.js'
 *        logger.info('Server started')
 *        logger.error('Something broke', { stack: err.stack })
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ─── Custom Format (dev) ──────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    `${timestamp} [${level}]: ${stack || message}`
  )
);

// ─── Production Format (JSON) ─────────────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ─── Transports ───────────────────────────────────────────────────────────────
const transports = [
  new winston.transports.Console({
    format: env.isDev ? devFormat : prodFormat,
    silent: env.isTest,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level   : 'error',
    format  : prodFormat,
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format  : prodFormat,
  }),
];

// ─── Logger Instance ──────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level     : env.isDev ? 'debug' : 'warn',
  transports,
  exitOnError: false,
});

export default logger;
