/**
 * weatherApi.js
 *
 * Frontend API client for AquaAI weather endpoints.
 *
 * IMPORTANT: This module is the ONLY place in the React app
 * that should communicate with the weather backend.
 * React must NEVER call Open-Meteo directly.
 *
 * All data comes from: GET /api/v1/weather/...
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const BASE = `${API_BASE}/api/v1`;
const WEATHER_BASE = `${BASE}/weather`;

// ─── Generic fetch wrapper ────────────────────────────────────

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${WEATHER_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || `Weather API error ${response.status}`);
  }
  return json.data;
};

// ─── Endpoints ───────────────────────────────────────────────

/**
 * Get averaged weather summary for all 11 Vidarbha districts.
 * Powers the Environmental Monitoring dashboard overview table.
 *
 * @returns {Promise<Array<{
 *   district_id: number,
 *   district_name: string,
 *   avg_temperature: number|null,
 *   avg_humidity: number|null,
 *   avg_rainfall: number|null,
 *   avg_precipitation: number|null,
 *   avg_wind_speed: number|null,
 *   villages_with_data: number,
 *   last_updated: string|null
 * }>>}
 */
export const getAllDistrictsWeather = () => apiFetch('/');

/**
 * Get averaged weather summary for a single district.
 *
 * @param {number} districtId
 * @returns {Promise<{ district: object, summary: object }>}
 */
export const getDistrictWeather = (districtId) =>
  apiFetch(`/districts/${districtId}`);

/**
 * Get current weather + 7-day forecast for a single village.
 * Will trigger a fresh Open-Meteo fetch if the cache is stale.
 *
 * @param {number} villageId
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<object>}  full village_weather row + forecast_data array
 */
export const getVillageWeather = (villageId, forceRefresh = false) =>
  apiFetch(`/villages/${villageId}${forceRefresh ? '?refresh=true' : ''}`);

/**
 * Admin: trigger a full Vidarbha weather sync.
 * @returns {Promise<object>}  per-district sync report
 */
export const syncAllWeather = () =>
  apiFetch('/sync', { method: 'POST' });

/**
 * Admin: trigger a weather sync for one district.
 * @param {number} districtId
 * @returns {Promise<{ synced: number, errors: string[] }>}
 */
export const syncDistrictWeather = (districtId) =>
  apiFetch(`/sync/district/${districtId}`, { method: 'POST' });
