/**
 * health.routes.js — Health Check Route
 *
 * GET /api/v1/health
 *
 * Public endpoint used by monitoring tools, load balancers, and
 * deployment pipelines to verify the service is alive and the DB is reachable.
 *
 * Response:
 *   { "status": "OK", "database": "Connected", "serverTime": "..." }
 */

import { Router } from 'express';
import { checkDBConnection } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import HTTP from '../constants/httpStatus.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let dbStatus = 'Connected';

    try {
      await checkDBConnection();
    } catch {
      dbStatus = 'Disconnected';
    }

    const httpStatus = dbStatus === 'Connected' ? HTTP.OK : HTTP.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      status    : dbStatus === 'Connected' ? 'OK' : 'ERROR',
      database  : dbStatus,
      serverTime: new Date().toISOString(),
    });
  })
);

export default router;
