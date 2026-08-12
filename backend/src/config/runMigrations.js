/**
 * runMigrations.js
 * Reads and executes all SQL migration files in order at startup.
 * Safe to re-run — all statements use CREATE TABLE IF NOT EXISTS.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

export const runMigrations = async () => {
  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) return;

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      // Split on semicolons, skip empty/comment-only statements
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        await pool.execute(stmt);
      }
      logger.info(`[Migration] Applied: ${file}`);
    }
  } catch (err) {
    logger.error(`[Migration] Failed: ${err.message}`);
    throw err;
  }
};
