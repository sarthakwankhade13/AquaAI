/**
 * drought.routes.js
 *
 * Express routes for drought prediction.
 * Mounted under /api/v1/drought in routes/index.js.
 *
 * Public:
 *   POST /predict              Run drought prediction for district + tehsil
 *   GET  /districts            List all available districts
 *   GET  /tehsils/:district    List tehsils for a district
 *   GET  /health               ML model health check
 */

import { Router } from 'express';
import {
  droughtPredict,
  getAvailableDistricts,
  getTehsilsForDistrict,
  droughtHealthCheck,
} from '../controllers/drought.controller.js';

const router = Router();

// ─── Prediction ───────────────────────────────────────────────────────────────
router.post('/predict',              droughtPredict);

// ─── Discovery ───────────────────────────────────────────────────────────────
router.get('/districts',             getAvailableDistricts);
router.get('/tehsils/:district',     getTehsilsForDistrict);

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health',                droughtHealthCheck);

export default router;
