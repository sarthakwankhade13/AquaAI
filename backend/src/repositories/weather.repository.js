/**
 * weather.repository.js
 *
 * Data-access layer for the village_weather cache table
 * and the district_coordinates lookup table.
 *
 * Uses UPSERT (INSERT … ON DUPLICATE KEY UPDATE) so every
 * call is idempotent — safe to call on every weather fetch.
 */

import { pool } from '../config/db.js';

// ═══════════════════════════════════════════════════════════════
//  VILLAGE WEATHER  (cache table)
// ═══════════════════════════════════════════════════════════════

/**
 * Upsert weather data for a village.
 * @param {object} params
 * @param {number} params.villageId
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number|null} params.temperature     °C
 * @param {number|null} params.humidity        %
 * @param {number|null} params.rainfall        mm
 * @param {number|null} params.precipitation   mm
 * @param {number|null} params.windSpeed       km/h
 * @param {number|null} params.weatherCode     WMO code
 * @param {Array|null}  params.forecastData    7-day forecast array
 */
export const upsertVillageWeather = async ({
  villageId,
  latitude,
  longitude,
  temperature,
  humidity,
  rainfall,
  precipitation,
  windSpeed,
  weatherCode,
  forecastData,
}) => {
  await pool.execute(
    `INSERT INTO village_weather
       (village_id, latitude, longitude, temperature, humidity, rainfall,
        precipitation, wind_speed, weather_code, forecast_data, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       latitude        = VALUES(latitude),
       longitude       = VALUES(longitude),
       temperature     = VALUES(temperature),
       humidity        = VALUES(humidity),
       rainfall        = VALUES(rainfall),
       precipitation   = VALUES(precipitation),
       wind_speed      = VALUES(wind_speed),
       weather_code    = VALUES(weather_code),
       forecast_data   = VALUES(forecast_data),
       fetched_at      = NOW(),
       updated_at      = NOW()`,
    [
      villageId,
      latitude,
      longitude,
      temperature   ?? null,
      humidity      ?? null,
      rainfall      ?? null,
      precipitation ?? null,
      windSpeed     ?? null,
      weatherCode   ?? null,
      forecastData  ? JSON.stringify(forecastData) : null,
    ]
  );
  return getWeatherByVillageId(villageId);
};

/**
 * Get cached weather row for a single village.
 * @param {number} villageId
 * @returns {object|null}
 */
export const getWeatherByVillageId = async (villageId) => {
  const [rows] = await pool.execute(
    `SELECT vw.*, v.village_name, v.official_village_code,
            t.taluka_name, d.district_name, d.id AS district_id
     FROM village_weather vw
     JOIN villages  v ON v.id = vw.village_id
     JOIN talukas   t ON t.id = v.taluka_id
     JOIN districts d ON d.id = t.district_id
     WHERE vw.village_id = ? LIMIT 1`,
    [villageId]
  );
  const row = rows[0] || null;
  if (row && row.forecast_data && typeof row.forecast_data === 'string') {
    try { row.forecast_data = JSON.parse(row.forecast_data); } catch (_) {}
  }
  return row;
};

/**
 * Get all cached weather rows for a district.
 * @param {number} districtId
 * @returns {object[]}
 */
export const getWeatherByDistrictId = async (districtId) => {
  const [rows] = await pool.execute(
    `SELECT vw.village_id, vw.temperature, vw.humidity, vw.rainfall,
            vw.precipitation, vw.wind_speed, vw.weather_code, vw.fetched_at,
            v.village_name, t.taluka_name, d.district_name
     FROM village_weather vw
     JOIN villages  v ON v.id = vw.village_id
     JOIN talukas   t ON t.id = v.taluka_id
     JOIN districts d ON d.id = t.district_id
     WHERE d.id = ?
     ORDER BY v.village_name ASC`,
    [districtId]
  );
  return rows;
};

/**
 * Get averaged weather summary for a district.
 * @param {number} districtId
 * @returns {object|null}
 */
export const getDistrictWeatherSummary = async (districtId) => {
  const [[row]] = await pool.execute(
    `SELECT
       d.district_name,
       ROUND(AVG(vw.temperature),  1) AS avg_temperature,
       ROUND(AVG(vw.humidity),     1) AS avg_humidity,
       ROUND(AVG(vw.rainfall),     2) AS avg_rainfall,
       ROUND(AVG(vw.precipitation),2) AS avg_precipitation,
       ROUND(AVG(vw.wind_speed),   1) AS avg_wind_speed,
       MAX(vw.temperature)            AS max_temperature,
       MIN(vw.temperature)            AS min_temperature,
       COUNT(vw.id)                   AS villages_with_data,
       MAX(vw.fetched_at)             AS last_updated
     FROM village_weather vw
     JOIN villages  v ON v.id = vw.village_id
     JOIN talukas   t ON t.id = v.taluka_id
     JOIN districts d ON d.id = t.district_id
     WHERE d.id = ?`,
    [districtId]
  );
  return row || null;
};

/**
 * Get summary for ALL Vidarbha districts in one query.
 * @returns {object[]}
 */
export const getAllDistrictsWeatherSummary = async () => {
  const [rows] = await pool.execute(
    `SELECT
       d.id AS district_id,
       d.district_name,
       ROUND(AVG(vw.temperature),  1) AS avg_temperature,
       ROUND(AVG(vw.humidity),     1) AS avg_humidity,
       ROUND(AVG(vw.rainfall),     2) AS avg_rainfall,
       ROUND(AVG(vw.precipitation),2) AS avg_precipitation,
       ROUND(AVG(vw.wind_speed),   1) AS avg_wind_speed,
       COUNT(vw.id)                   AS villages_with_data,
       MAX(vw.fetched_at)             AS last_updated
     FROM districts d
     LEFT JOIN talukas t   ON t.district_id = d.id
     LEFT JOIN villages v  ON v.taluka_id   = t.id
     LEFT JOIN village_weather vw ON vw.village_id = v.id
     WHERE d.region = 'Vidarbha'
     GROUP BY d.id, d.district_name
     ORDER BY d.district_name ASC`
  );
  return rows;
};

/**
 * Check if cached weather is stale (older than TTL minutes).
 * @param {number}  villageId
 * @param {number}  cacheTtlMinutes
 * @returns {boolean} true = stale or missing
 */
export const isWeatherStale = async (villageId, cacheTtlMinutes) => {
  const [[row]] = await pool.execute(
    `SELECT fetched_at FROM village_weather WHERE village_id = ? LIMIT 1`,
    [villageId]
  );
  if (!row) return true; // no data yet
  const ageMs = Date.now() - new Date(row.fetched_at).getTime();
  return ageMs > cacheTtlMinutes * 60 * 1000;
};

// ═══════════════════════════════════════════════════════════════
//  DISTRICT COORDINATES  (seed/fallback lookup)
// ═══════════════════════════════════════════════════════════════

/**
 * Get fallback coordinates for a district by name.
 * @param {string} districtName
 * @returns {{ latitude: number, longitude: number }|null}
 */
export const getDistrictCoordinates = async (districtName) => {
  const [rows] = await pool.execute(
    `SELECT latitude, longitude FROM district_coordinates
     WHERE district_name = ? LIMIT 1`,
    [districtName]
  );
  return rows[0] || null;
};

/**
 * Get all district coordinate centroids.
 * @returns {object[]}
 */
export const getAllDistrictCoordinates = async () => {
  const [rows] = await pool.execute(
    `SELECT district_name, latitude, longitude FROM district_coordinates ORDER BY district_name`
  );
  return rows;
};

/**
 * Update (or set) coordinates on a village row.
 * @param {number} villageId
 * @param {number} latitude
 * @param {number} longitude
 */
export const setVillageCoordinates = async (villageId, latitude, longitude) => {
  await pool.execute(
    `UPDATE villages SET latitude = ?, longitude = ? WHERE id = ?`,
    [latitude, longitude, villageId]
  );
};

/**
 * Get all villages with or without coordinates for a given district.
 * Used by the batch sync job.
 * @param {number} districtId
 * @returns {object[]}
 */
export const getVillagesForWeatherSync = async (districtId) => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.village_name, v.latitude, v.longitude,
            t.taluka_name, d.id AS district_id, d.district_name
     FROM villages v
     JOIN talukas   t ON t.id = v.taluka_id
     JOIN districts d ON d.id = t.district_id
     WHERE d.id = ? AND v.status = 'active'
     LIMIT 10`,   /* limit per district to avoid rate hammering */
    [districtId]
  );
  return rows;
};
