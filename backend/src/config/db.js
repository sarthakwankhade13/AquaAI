/**
 * db.js — MySQL Connection Pool
 *
 * Creates and exports a mysql2/promise connection pool.
 * Exposes connectDB() for startup verification and
 * checkDBConnection() for the health check endpoint.
 *
 * All application queries import `pool` directly from here.
 * Usage: import { pool } from './config/db.js'
 */

import mysql from 'mysql2/promise';
import env from './env.js';
import logger from '../utils/logger.js';

// ─── Connection Pool ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host           : env.db.host,
  port           : env.db.port,
  user           : env.db.user,
  password       : env.db.password,
  database       : env.db.name,
  waitForConnections: true,
  connectionLimit: 10,      // max parallel connections
  queueLimit     : 0,       // unlimited queue
  timezone       : '+05:30', // IST — Vidarbha region
  dateStrings    : true,    // return DATE/DATETIME as strings
});

// ─── Startup Verification ─────────────────────────────────────────────────────
/**
 * Verifies DB connectivity at server startup.
 * Calls process.exit(1) on failure so the app never starts broken.
 */
const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    logger.info(`MySQL connected: ${env.db.host}:${env.db.port}/${env.db.name}`);
    conn.release();
  } catch (error) {
    logger.error(`MySQL connection failed: ${error.message}`);
    process.exit(1);
  }
};

// ─── Health Check Probe ───────────────────────────────────────────────────────
/**
 * Lightweight DB probe used by GET /api/v1/health.
 * Throws if the connection cannot be established.
 */
const checkDBConnection = async () => {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
};

export { pool, connectDB, checkDBConnection };
