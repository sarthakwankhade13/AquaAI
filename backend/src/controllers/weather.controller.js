/**
 * weather.controller.js
 *
 * REST controller for weather endpoints.
 * All responses use the standard sendSuccess / sendError helpers.
 *
 * Routes (mounted under /api/v1/weather):
 *   GET  /                          → overview: all-district weather summary
 *   GET  /districts/:districtId     → single district averaged summary
 *   GET  /villages/:villageId       → single village current + forecast
 *   POST /sync                      → admin: refresh all districts (full sync)
 *   POST /sync/district/:districtId → admin: refresh one district
 */

import * as weatherService from '../services/weather/weather.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import HTTP from '../constants/httpStatus.js';
import logger from '../utils/logger.js';

// ─── Overview ─────────────────────────────────────────────────

/**
 * GET /api/v1/weather
 * Returns cached weather summary for all 11 Vidarbha districts.
 * Suitable for the EnvironmentalMonitoring dashboard table.
 */
export const getAllDistrictsWeather = async (req, res, next) => {
  try {
    const data = await weatherService.getAllDistrictsWeatherSummary();
    return sendSuccess(res, HTTP.OK, 'Vidarbha district weather summary fetched', data);
  } catch (err) {
    next(err);
  }
};

// ─── District ─────────────────────────────────────────────────

/**
 * GET /api/v1/weather/districts/:districtId
 * Returns averaged cached weather for one district.
 */
export const getDistrictWeather = async (req, res, next) => {
  try {
    const { districtId } = req.params;
    if (!districtId || isNaN(Number(districtId))) {
      return sendError(res, HTTP.BAD_REQUEST, 'Invalid districtId parameter');
    }
    const data = await weatherService.getDistrictWeatherSummary(Number(districtId));
    return sendSuccess(res, HTTP.OK, `Weather summary for district ${districtId}`, data);
  } catch (err) {
    if (err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    next(err);
  }
};

// ─── Village ──────────────────────────────────────────────────

/**
 * GET /api/v1/weather/villages/:villageId
 * Returns current weather + 7-day forecast for one village.
 * Triggers an Open-Meteo refresh if the cache is stale.
 *
 * Query params:
 *   refresh=true  — skip cache and force a fresh fetch
 */
export const getVillageWeather = async (req, res, next) => {
  try {
    const { villageId } = req.params;
    if (!villageId || isNaN(Number(villageId))) {
      return sendError(res, HTTP.BAD_REQUEST, 'Invalid villageId parameter');
    }
    const forceRefresh = req.query.refresh === 'true';
    const data = await weatherService.getVillageWeather(Number(villageId), { forceRefresh });
    if (!data) {
      return sendError(res, HTTP.NOT_FOUND, `No weather data available for village ${villageId}`);
    }
    return sendSuccess(res, HTTP.OK, 'Village weather fetched', data);
  } catch (err) {
    if (err.message?.includes('not found') || err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    if (err.message?.includes('timed out') || err.message?.includes('Open-Meteo')) {
      return sendError(res, HTTP.SERVICE_UNAVAILABLE, `Weather service error: ${err.message}`);
    }
    next(err);
  }
};

// ─── Admin Sync ───────────────────────────────────────────────

/**
 * POST /api/v1/weather/sync
 * Admin-triggered full sync: refreshes weather for all districts.
 */
export const syncAllWeather = async (req, res, next) => {
  try {
    logger.info(`[WEATHER_CTRL] Full weather sync triggered by user: ${req.user?.userId || 'Unknown'}`);
    const report = await weatherService.syncAllDistrictsWeather();
    return sendSuccess(res, HTTP.OK, 'Full Vidarbha weather sync complete', report);
  } catch (err) {
    logger.error(`[WEATHER_CTRL] Full sync failed: ${err.message}`);
    return sendError(res, HTTP.INTERNAL_SERVER_ERROR, `Weather sync failed: ${err.message}`);
  }
};

/**
 * POST /api/v1/weather/sync/district/:districtId
 * Admin-triggered district-level sync.
 */
export const syncDistrictWeather = async (req, res, next) => {
  try {
    const { districtId } = req.params;
    if (!districtId || isNaN(Number(districtId))) {
      return sendError(res, HTTP.BAD_REQUEST, 'Invalid districtId parameter');
    }
    logger.info(`[WEATHER_CTRL] District ${districtId} weather sync triggered by user: ${req.user?.userId || 'Unknown'}`);
    const result = await weatherService.syncDistrictWeather(Number(districtId));
    return sendSuccess(res, HTTP.OK, `District ${districtId} weather sync complete`, result);
  } catch (err) {
    if (err.message?.includes('not found')) {
      return sendError(res, HTTP.NOT_FOUND, err.message);
    }
    logger.error(`[WEATHER_CTRL] District sync failed: ${err.message}`);
    return sendError(res, HTTP.INTERNAL_SERVER_ERROR, `District weather sync failed: ${err.message}`);
  }
};
