/**
 * index.js — Central Route Aggregator
 *
 * All feature routes are mounted here under /api/v1.
 * This file is the single import point for app.js.
 *
 * Current routes:
 * /api/v1/health    → Health check
 * /api/v1/auth      → Authentication
 * /api/v1/users     → User Management
 * /api/v1/          → Geography master data
 * /api/v1/weather   → Weather data (Open-Meteo backed)
 */

import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import geographyRoutes from './geography.routes.js';
import weatherRoutes from './weather.routes.js';

const router = Router();

// ─── Foundation Routes ────────────────────────────────────────────────────────
router.use('/health', healthRoutes);

// ─── Feature Routes ───────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/', geographyRoutes);
router.use('/weather', weatherRoutes);

export default router;