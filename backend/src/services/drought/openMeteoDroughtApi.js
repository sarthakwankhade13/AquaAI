/**
 * openMeteoDroughtApi.js
 *
 * Extended Open-Meteo client for drought prediction.
 * Fetches HISTORICAL daily data (precipitation_sum, temperature_2m_max, etc.)
 * for a date range — used during drought prediction to enrich the feature vector.
 *
 * Distinct from the existing open-meteo.api.js which fetches current + 7-day forecast.
 * Training dataset: Government historical CSV only.
 * This module: prediction-time only, recent historical + short forecast.
 *
 * Handles:
 *  - Timeout
 *  - HTTP 429 with exponential backoff
 *  - Response validation
 *  - In-memory cache (TTL-based)
 */

import logger from '../../utils/logger.js';
import env    from '../../config/env.js';

// ─── In-memory cache ──────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL_MS = (env.weather?.cacheTtlMins ?? 30) * 60 * 1000;

function _cacheKey(lat, lng, startDate, endDate) {
  return `${lat}|${lng}|${startDate}|${endDate}`;
}

// ─── Retry with exponential backoff ──────────────────────────────────────────
async function fetchWithRetry(url, timeoutMs = 10000, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429) {
        const backoff = Math.pow(2, attempt) * 1000;
        logger.warn(`[OM_DROUGHT] HTTP 429 — retrying in ${backoff}ms (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Open-Meteo HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      return await res.json();

    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === 'AbortError') {
        logger.warn(`[OM_DROUGHT] Timeout (attempt ${attempt})`);
      } else if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 500;
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  throw lastError ?? new Error('Open-Meteo fetch failed after retries');
}

/**
 * fetchDroughtWeatherData
 *
 * Fetches daily precipitation and temperature for the last `lookbackDays` days,
 * used as recent context for drought prediction feature engineering.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} lookbackDays  - How many past days to fetch (default: 90)
 * @returns {Promise<object>}    - { daily: { time, precipitation_sum, temperature_2m_max, ... }, fetched_at }
 */
export async function fetchDroughtWeatherData(latitude, longitude, lookbackDays = 90) {
  const endDate   = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - lookbackDays);

  const fmt = d => d.toISOString().split('T')[0];
  const startStr = fmt(startDate);
  const endStr   = fmt(endDate);

  // ── Cache check ────────────────────────────────────────────────────────────
  const key = _cacheKey(latitude, longitude, startStr, endStr);
  const cached = _cache.get(key);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
    logger.info(`[OM_DROUGHT] Cache hit: ${key}`);
    return cached.data;
  }

  // ── Build URL ─────────────────────────────────────────────────────────────
  const baseUrl = env.weather?.historicalApiUrl ?? 'https://archive-api.open-meteo.com/v1/archive';
  const url = new URL(baseUrl);
  url.searchParams.set('latitude',   String(latitude));
  url.searchParams.set('longitude',  String(longitude));
  url.searchParams.set('start_date', startStr);
  url.searchParams.set('end_date',   endStr);
  url.searchParams.set('daily',      'precipitation_sum,rain_sum,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean');
  url.searchParams.set('timezone',   'Asia/Kolkata');

  logger.info(`[OM_DROUGHT] Fetching: lat=${latitude}, lng=${longitude}, ${startStr} → ${endStr}`);

  try {
    const raw = await fetchWithRetry(url.toString(), env.weather?.timeoutMs ?? 10000);

    if (!raw?.daily?.time) {
      throw new Error('Open-Meteo drought response missing daily.time');
    }

    const data = {
      daily     : raw.daily,
      fetched_at: new Date().toISOString(),
      source    : 'open_meteo_archive',
      date_range: { start: startStr, end: endStr },
      coordinates: { latitude, longitude },
    };

    // Cache result
    _cache.set(key, { ts: Date.now(), data });
    logger.info(`[OM_DROUGHT] Fetched ${raw.daily.time.length} daily records.`);

    return data;

  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('Timeout')) {
      logger.error(`[OM_DROUGHT] Timeout for lat=${latitude}, lng=${longitude}`);
      throw Object.assign(new Error('Open-Meteo request timed out'), { code: 'OPEN_METEO_TIMEOUT' });
    }
    if (err.message?.includes('429')) {
      throw Object.assign(new Error('Open-Meteo rate limited'), { code: 'OPEN_METEO_RATE_LIMITED' });
    }
    logger.error(`[OM_DROUGHT] Error: ${err.message}`);
    throw Object.assign(err, { code: 'OPEN_METEO_ERROR' });
  }
}

/**
 * clearDroughtWeatherCache — clear the in-memory cache (for testing).
 */
export function clearDroughtWeatherCache() {
  _cache.clear();
}
