/**
 * weather.service.js
 *
 * Business logic layer for weather data.
 *
 * Strategy:
 *   1. Check MySQL cache (village_weather table).
 *   2. If data is fresh (< WEATHER_CACHE_TTL_MINUTES old) → return cache.
 *   3. If stale/missing → resolve coordinates → call Open-Meteo →
 *      upsert into DB → return fresh data.
 *
 * Coordinate resolution order:
 *   a. village.latitude / village.longitude  (set by admin or a previous sync)
 *   b. District centroid from district_coordinates table
 *   c. Hard-fail with a 503 if no coordinates can be resolved
 */

import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import { fetchWeather, parseWeatherResponse } from './open-meteo.api.js';
import * as weatherRepo from '../../repositories/weather.repository.js';
import * as geoRepo     from '../../repositories/geography.repository.js';

// ─── Internal helpers ─────────────────────────────────────────

/**
 * Resolve the best available lat/lng for a village.
 * Tries village-level coords first, then district centroid.
 * @param {object} village  — row from getVillageById (includes district_name)
 * @returns {{ latitude: number, longitude: number }}
 */
const resolveCoordinates = async (village) => {
  // 1. Village has its own coordinates
  if (village.latitude != null && village.longitude != null) {
    return { latitude: Number(village.latitude), longitude: Number(village.longitude) };
  }

  // 2. Fall back to district centroid
  const centroid = await weatherRepo.getDistrictCoordinates(village.district_name);
  if (centroid) {
    logger.info(
      `[WEATHER_SVC] Village ${village.id} has no coords — using ${village.district_name} centroid`
    );
    return { latitude: Number(centroid.latitude), longitude: Number(centroid.longitude) };
  }

  throw new Error(
    `Cannot resolve coordinates for village "${village.village_name}" (id=${village.id}). ` +
    `No village-level coords and district "${village.district_name}" not found in centroid table.`
  );
};

// ─── Public API ───────────────────────────────────────────────

/**
 * getVillageWeather
 *
 * Returns weather data for a single village, refreshing from
 * Open-Meteo if the cache is stale or absent.
 *
 * @param {number} villageId
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh=false]  skip cache and always call API
 * @returns {Promise<object>}  normalised weather row + forecast
 */
export const getVillageWeather = async (villageId, { forceRefresh = false } = {}) => {
  // 1. If cache is fresh, return it immediately
  if (!forceRefresh) {
    const stale = await weatherRepo.isWeatherStale(villageId, env.weather.cacheTtlMins);
    if (!stale) {
      logger.info(`[WEATHER_SVC] Cache hit for village ${villageId}`);
      return weatherRepo.getWeatherByVillageId(villageId);
    }
  }

  // 2. Load village metadata (name, district, current coords)
  const village = await geoRepo.getVillageById(villageId);
  if (!village) throw new Error(`Village not found: id=${villageId}`);

  // 3. Resolve coordinates
  const { latitude, longitude } = await resolveCoordinates(village);

  // 4. Fetch from Open-Meteo
  let raw;
  try {
    raw = await fetchWeather(latitude, longitude);
  } catch (err) {
    logger.error(`[WEATHER_SVC] Open-Meteo fetch failed for village ${villageId}: ${err.message}`);
    // Serve stale cache if it exists, rather than returning nothing
    const staleCache = await weatherRepo.getWeatherByVillageId(villageId);
    if (staleCache) {
      logger.warn(`[WEATHER_SVC] Returning stale cache for village ${villageId}`);
      return { ...staleCache, _stale: true };
    }
    throw err;
  }

  // 5. Parse the raw response into our schema
  const { current, forecast } = parseWeatherResponse(raw);

  // 6. Persist to MySQL
  const saved = await weatherRepo.upsertVillageWeather({
    villageId,
    latitude,
    longitude,
    temperature   : current.temperature,
    humidity      : current.humidity,
    rainfall      : current.rainfall,
    precipitation : current.precipitation,
    windSpeed     : current.windSpeed,
    weatherCode   : current.weatherCode,
    forecastData  : forecast,
  });

  return saved;
};

/**
 * getDistrictWeatherSummary
 *
 * Returns an averaged summary for all cached villages in a district.
 * This does NOT trigger fresh fetches — data is from the existing cache.
 *
 * @param {number} districtId
 * @returns {Promise<object>}
 */
export const getDistrictWeatherSummary = async (districtId) => {
  const district = await geoRepo.getDistrictById(districtId);
  if (!district) throw new Error(`District not found: id=${districtId}`);

  const summary = await weatherRepo.getDistrictWeatherSummary(districtId);
  return { district, summary };
};

/**
 * getAllDistrictsWeatherSummary
 *
 * Returns summarised weather for ALL 11 Vidarbha districts.
 * Powers the Environmental Monitoring dashboard table.
 *
 * @returns {Promise<object[]>}
 */
export const getAllDistrictsWeatherSummary = async () => {
  return weatherRepo.getAllDistrictsWeatherSummary();
};

/**
 * syncDistrictWeather
 *
 * Fetches fresh weather data for up to 10 villages per district,
 * using district centroid as the coordinate source for unmapped villages.
 * Intended for admin-triggered or scheduled syncs.
 *
 * @param {number} districtId
 * @returns {Promise<{ synced: number, errors: string[] }>}
 */
export const syncDistrictWeather = async (districtId) => {
  const district = await geoRepo.getDistrictById(districtId);
  if (!district) throw new Error(`District not found: id=${districtId}`);

  const villages = await weatherRepo.getVillagesForWeatherSync(districtId);
  const results  = { synced: 0, errors: [] };

  for (const village of villages) {
    try {
      // attach district_name field (needed by resolveCoordinates)
      village.district_name = district.district_name;
      await getVillageWeather(village.id, { forceRefresh: true });
      results.synced++;
    } catch (err) {
      logger.warn(`[WEATHER_SVC] Sync failed for village ${village.id}: ${err.message}`);
      results.errors.push(`${village.village_name}: ${err.message}`);
    }
  }

  logger.info(
    `[WEATHER_SVC] District ${district.district_name} sync done: ${results.synced} ok, ${results.errors.length} errors`
  );
  return results;
};

/**
 * syncAllDistrictsWeather
 *
 * Triggers syncDistrictWeather for every Vidarbha district.
 * The district centroid is used for coordinate resolution,
 * so this always works even without village-level coordinates.
 *
 * @returns {Promise<object>}  aggregate results per district
 */
export const syncAllDistrictsWeather = async () => {
  const districts = await geoRepo.getAllDistricts();
  const report = {};

  for (const district of districts) {
    report[district.district_name] = await syncDistrictWeather(district.id);
  }

  return report;
};
