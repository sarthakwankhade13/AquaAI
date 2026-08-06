/**
 * index.js — Central Route Aggregator
 *
 * All feature routes are mounted here under /api/v1.
 * This file is the single import point for app.js.
 *
 * Current routes:
 *   /api/v1/health  → health check
 *
 * Future routes will be added as each feature is built:
 *   /api/v1/auth    → Authentication
 *   /api/v1/users   → User Management
 *   /api/v1/env     → Environmental Monitoring
 *   ... etc
 */

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// ─── Foundation Routes ────────────────────────────────────────────────────────
router.use('/health', healthRoutes);

// ─── Feature Routes (added per module) ───────────────────────────────────────
router.use('/auth', authRoutes);
// router.use('/users',  userRoutes);   ← User Management module
// ... more routes will be uncommented as modules are built

export default router;
