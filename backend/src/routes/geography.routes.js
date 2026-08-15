/**
 * geography.routes.js
 * Routes for geographical master data and admin sync.
 */

import { Router } from 'express';
import {
  getAllDistricts,
  getDistrictById,
  getTalukasByDistrict,
  getTalukaById,
  getVillagesByTaluka,
  getVillageById,
  getVillages,
  syncGeography,
  validateGeography,
} from '../controllers/geography.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import ROLES from '../constants/roles.js';

const router = Router();

// ─── Public Geography Master-Data Queries ──────────────────────
router.get('/districts',                      getAllDistricts);
router.get('/districts/:districtId',          getDistrictById);
router.get('/districts/:districtId/talukas',  getTalukasByDistrict);
router.get('/talukas/:talukaId',              getTalukaById);
router.get('/talukas/:talukaId/villages',     getVillagesByTaluka);
router.get('/villages',                       getVillages);
router.get('/villages/:villageId',            getVillageById);

// ─── Protected Admin Endpoints ─────────────────────────────────
router.post(
  '/admin/geography/sync',
  verifyJWT,
  authorizeRoles(ROLES.WRD_ADMIN),
  syncGeography
);

router.get(
  '/admin/geography/validate',
  verifyJWT,
  authorizeRoles(ROLES.WRD_ADMIN),
  validateGeography
);

export default router;
