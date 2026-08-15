/**
 * server.js — HTTP Server Entry Point
 *
 * Responsibilities:
 *   1. Validate all environment variables (env.js runs on import)
 *   2. Verify MySQL database connectivity
 *   3. Start the HTTP server and begin accepting requests
 *   4. Configure graceful shutdown on SIGTERM / SIGINT
 *   5. Handle unhandled promise rejections and uncaught exceptions
 *
 * This file is the single entry point: `node src/server.js`
 */

import './config/env.js';             // Validate env vars immediately
import app          from './app.js';
import { connectDB } from './config/db.js';
import { runMigrations } from './config/runMigrations.js';
import logger        from './utils/logger.js';
import serverConfig  from './config/server.js';

const PORT = serverConfig.port;

// ─── Startup ──────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Step 1: Verify DB connectivity before accepting any traffic
    await connectDB();

    // Step 2: Run SQL migrations (idempotent — safe every restart)
    await runMigrations();

    // Step 3: Start HTTP server
    const server = app.listen(PORT, serverConfig.host, () => {
      logger.info(`┌─────────────────────────────────────────────────┐`);
      logger.info(`│  AquaAI API Server                              │`);
      logger.info(`│  Environment : ${String(process.env.NODE_ENV).padEnd(32)}│`);
      logger.info(`│  Port        : ${String(PORT).padEnd(32)}│`);
      logger.info(`│  API Prefix  : ${serverConfig.apiPrefix.padEnd(32)}│`);
      logger.info(`└─────────────────────────────────────────────────┘`);
    });

    // ─── Graceful Shutdown ──────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.warn(`${signal} received — shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed. Goodbye! 👋');
        process.exit(0);
      });

      // Force-kill if connections don't drain within timeout
      setTimeout(() => {
        logger.error(`Shutdown timeout exceeded (${serverConfig.shutdownTimeout}ms) — forcing exit`);
        process.exit(1);
      }, serverConfig.shutdownTimeout);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // ─── Safety Nets ────────────────────────────────────────────────────────
    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Promise Rejection: ${reason}`);
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
      process.exit(1);
    });

  } catch (err) {
    logger.error(`Server startup failed: ${err.message}`);
    process.exit(1);
  }
};

startServer();
