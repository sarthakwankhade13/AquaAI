/**
 * morgan.middleware.js — HTTP Request Logger
 *
 * Streams Morgan's HTTP access logs through Winston so ALL application
 * logs (HTTP + app) flow through one unified logging system.
 *
 * Format:
 *  - Development : 'dev'      (colourised, concise)
 *  - Production  : 'combined' (Apache combined format, detailed)
 *
 * Usage: import { httpLogger } from '../middlewares/morgan.middleware.js'
 */

import morgan from 'morgan';
import logger from '../utils/logger.js';
import env from '../config/env.js';

// Bridge Morgan → Winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

const httpLogger = morgan(
  env.isProd ? 'combined' : 'dev',
  { stream }
);

export { httpLogger };
