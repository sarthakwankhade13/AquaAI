/**
 * open-meteo.api.js
 *
 * Thin HTTP client for the Open-Meteo free weather API.
 * https://open-meteo.com/en/docs
 *
 * – No API key required.
 * – Fetches current conditions + 7-day daily forecast.
 * – Handles timeouts and non-2xx responses cleanly.
 * – All Open-Meteo calls MUST go through this module;
 *   React must never call Open-Meteo directly.
 */

import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Open-Meteo query parameters for Vidarbha region use-case.
 *
 * current  → snapshot metrics shown on dashboard
 * daily    → 7-day forecast array
 * timezone → IST (Asia/Kolkata)
 */
const CURRENT_VARIABLES = [
  'temperature_2m',         // °C  — air temperature at 2 m
  'relative_humidity_2m',   // %   — relative humidity at 2 m
  'precipitation',          // mm  — total precipitation (rain + snow etc.)
  'rain',                   // mm  — rainfall component only
  'wind_speed_10m',         // km/h — wind speed at 10 m
  'weather_code',           // WMO code — current sky/condition
].join(',');

const DAILY_VARIABLES = [
  'temperature_2m_max',     // °C daily max
  'temperature_2m_min',     // °C daily min
  'precipitation_sum',      // mm total daily
  'rain_sum',               // mm rain-only daily
].join(',');

/**
 * fetchWeather — call Open-Meteo for a single lat/lng pair.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object>} Parsed Open-Meteo JSON response
 * @throws  {Error} on network failure, timeout, or non-200 response
 */
export const fetchWeather = async (latitude, longitude) => {
  const url = new URL(env.weather.apiUrl);
  url.searchParams.set('latitude',    String(latitude));
  url.searchParams.set('longitude',   String(longitude));
  url.searchParams.set('current',     CURRENT_VARIABLES);
  url.searchParams.set('daily',       DAILY_VARIABLES);
  url.searchParams.set('timezone',    'Asia/Kolkata');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.weather.timeoutMs);

  logger.info(`[WEATHER_API] Fetching: lat=${latitude}, lng=${longitude}`);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `Open-Meteo responded with ${response.status} ${response.statusText}: ${errText.slice(0, 200)}`
      );
    }

    const data = await response.json();

    // Validate the shape we rely on
    if (!data?.current || !data?.daily) {
      throw new Error('Open-Meteo response missing expected current/daily fields');
    }

    logger.info(`[WEATHER_API] Success: lat=${latitude}, lng=${longitude}`);
    return data;

  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      throw new Error(
        `Open-Meteo request timed out after ${env.weather.timeoutMs}ms (lat=${latitude}, lng=${longitude})`
      );
    }
    throw err;
  }
};

/**
 * parseWeatherResponse — extract a clean, normalised weather object
 * from a raw Open-Meteo API response.
 *
 * @param {object} raw  — the full JSON returned by fetchWeather()
 * @returns {{ current: object, forecast: object[] }}
 */
export const parseWeatherResponse = (raw) => {
  const c = raw.current;

  const current = {
    temperature  : c.temperature_2m        ?? null,   // °C
    humidity     : c.relative_humidity_2m  ?? null,   // %
    rainfall     : c.rain                  ?? null,   // mm
    precipitation: c.precipitation         ?? null,   // mm
    windSpeed    : c.wind_speed_10m        ?? null,   // km/h
    weatherCode  : c.weather_code          ?? null,
    observedAt   : c.time                  ?? null,
  };

  // Build forecast array: one entry per day
  const d = raw.daily;
  const forecast = (d.time || []).map((date, i) => ({
    date           : date,
    tempMax        : d.temperature_2m_max?.[i]   ?? null,
    tempMin        : d.temperature_2m_min?.[i]   ?? null,
    precipitationSum: d.precipitation_sum?.[i]   ?? null,
    rainSum        : d.rain_sum?.[i]              ?? null,
  }));

  return { current, forecast };
};
