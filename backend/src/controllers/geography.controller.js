/**
 * geography.controller.js
 * Controller handling geography master-data endpoints and admin sync.
 */

import * as districtService from '../services/geography/district.service.js';
import * as talukaService from '../services/geography/taluka.service.js';
import * as villageService from '../services/geography/village.service.js';
import { syncVidarbhaGeography } from '../services/geography/geography-sync.service.js';
import * as geoRepo from '../repositories/geography.repository.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import HTTP from '../constants/httpStatus.js';
import logger from '../utils/logger.js';

/**
 * GET /api/v1/districts
 * Return all 11 Vidarbha districts
 */
export const getAllDistricts = async (req, res, next) => {
  try {
    const districts = await districtService.getAllDistricts();
    return sendSuccess(res, HTTP.OK, 'Districts fetched successfully', districts);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/districts/:districtId
 * Return one district by ID
 */
export const getDistrictById = async (req, res, next) => {
  try {
    const { districtId } = req.params;
    const district = await districtService.getDistrictById(districtId);
    return sendSuccess(res, HTTP.OK, 'District fetched successfully', district);
  } catch (err) {
    if (err.statusCode === HTTP.NOT_FOUND || err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/districts/:districtId/talukas
 * Return all talukas belonging to that district
 */
export const getTalukasByDistrict = async (req, res, next) => {
  try {
    const { districtId } = req.params;
    const talukas = await districtService.getTalukasByDistrict(districtId);
    return sendSuccess(res, HTTP.OK, 'Talukas fetched successfully', talukas);
  } catch (err) {
    if (err.statusCode === HTTP.NOT_FOUND || err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/talukas/:talukaId
 * Return one taluka by ID
 */
export const getTalukaById = async (req, res, next) => {
  try {
    const { talukaId } = req.params;
    const taluka = await talukaService.getTalukaById(talukaId);
    return sendSuccess(res, HTTP.OK, 'Taluka fetched successfully', taluka);
  } catch (err) {
    if (err.statusCode === HTTP.NOT_FOUND || err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/talukas/:talukaId/villages
 * Return all villages belonging to that taluka
 */
export const getVillagesByTaluka = async (req, res, next) => {
  try {
    const { talukaId } = req.params;
    const villages = await talukaService.getVillagesByTaluka(talukaId);
    return sendSuccess(res, HTTP.OK, 'Villages fetched successfully', villages);
  } catch (err) {
    if (err.statusCode === HTTP.NOT_FOUND || err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/villages/:villageId
 * Return one village by ID
 */
export const getVillageById = async (req, res, next) => {
  try {
    const { villageId } = req.params;
    const village = await villageService.getVillageById(villageId);
    return sendSuccess(res, HTTP.OK, 'Village fetched successfully', village);
  } catch (err) {
    if (err.statusCode === HTTP.NOT_FOUND || err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/villages
 * Support filters: ?district_id= & ?taluka_id= & ?search=
 */
export const getVillages = async (req, res, next) => {
  try {
    const { district_id, taluka_id, search } = req.query;
    const villages = await villageService.getVillagesFiltered({ district_id, taluka_id, search });
    return sendSuccess(res, HTTP.OK, 'Villages query executed successfully', villages);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/geography/summary
 * Return real-time count metrics from MySQL database
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const districtCount = await geoRepo.countDistricts();
    const talukaCount   = await geoRepo.countTalukas();
    const villageCount  = await geoRepo.countVillages();

    return sendSuccess(res, HTTP.OK, 'Dashboard summary fetched successfully', {
      totalDistricts: districtCount,
      totalTalukas: talukaCount,
      totalVillages: villageCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/geography/validate
 * Validate data integrity: counts, orphans, duplicates
 */
export const validateGeography = async (req, res, next) => {
  try {
    const districtCount = await geoRepo.countDistricts();
    const talukaCount   = await geoRepo.countTalukas();
    const villageCount  = await geoRepo.countVillages();

    const issues = [];
    if (districtCount !== 11) {
      issues.push(`Expected 11 Vidarbha districts, found ${districtCount}`);
    }

    return sendSuccess(res, HTTP.OK, 'Geography validation complete', {
      districtCount,
      talukaCount,
      villageCount,
      expectedDistricts: 11,
      isValid: issues.length === 0,
      issues,
    });
  } catch (err) {
    next(err);
  }
};

export const syncGeography = async (req, res, next) => {
  try {
    logger.info(`[ADMIN_SYNC] Geography sync triggered by user: ${req.user?.userId || 'Unknown'} (${req.user?.role})`);
    const resultStats = await syncVidarbhaGeography();
    return sendSuccess(res, HTTP.OK, 'Vidarbha geographical data synchronized successfully', resultStats);
  } catch (err) {
    logger.error(`[ADMIN_SYNC] Sync failed: ${err.message}`);
    return sendError(res, HTTP.INTERNAL_SERVER_ERROR, `Synchronization failed: ${err.message}`);
  }
};
