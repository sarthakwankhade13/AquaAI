/**
 * server.js — Server Configuration Constants
 *
 * Centralises all server-level constants so they are never
 * hardcoded across multiple files.
 *
 * Usage: import serverConfig from './config/server.js'
 */

import env from './env.js';

const serverConfig = {
  port   : env.PORT,
  host   : '0.0.0.0',

  // API versioning prefix — bump to /api/v2 here when needed
  apiPrefix: '/api/v1',

  // Allowed HTTP methods for CORS
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Max body size accepted by the JSON parser
  jsonLimit   : '10mb',
  urlencodedLimit: '10mb',

  // Graceful shutdown timeout (ms) — force-kills if exceeded
  shutdownTimeout: 10_000,
};

export default serverConfig;
