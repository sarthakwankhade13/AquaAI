/**
 * weather.routes.js
 *
 * Express routes for weather data endpoints.
 * Mounted under /api/v1/weather in routes/index.js.
 *
 * Public (no auth):
 *   GET  /                          All districts weather overview
 *   GET  /districts/:districtId     Single district summary
 *   GET  /villages/:villageId       Single village current + forecast
 *
 * Admin-only (add auth middleware when ready):
 *   POST /sync                      Full Vidarbha sync
 *   POST /sync/district/:districtId District sync
 */

import { Router } from 'express';
import {
  getAllDistrictsWeather,
  getDistrictWeather,
  getVillageWeather,
  syncAllWeather,
  syncDistrictWeather,
} from '../controllers/weather.controller.js';

const router = Router();

// ─── Public endpoints ─────────────────────────────────────────
router.get('/',                              getAllDistrictsWeather);
router.get('/districts/:districtId',         getDistrictWeather);
router.get('/villages/:villageId',           getVillageWeather);

// ─── Admin sync endpoints ─────────────────────────────────────
// TODO: Add verifyToken + requireRole('super_admin','wrd_admin') middleware here
router.post('/sync',                         syncAllWeather);
router.post('/sync/district/:districtId',    syncDistrictWeather);

export default router;
