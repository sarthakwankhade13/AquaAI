/**
 * droughtPredictionService.js
 *
 * Node.js service that bridges the Python ML inference script with the
 * Express API. Uses child_process.spawn to call predict_drought.py.
 *
 * Flow:
 *   1. Receive district + tehsil
 *   2. Fetch recent Open-Meteo historical data (last 90 days)
 *   3. Spawn Python predict_drought.py with coords + OM data
 *   4. Parse stdout JSON
 *   5. Store result in DB (drought_predictions table)
 *   6. Return structured prediction object
 */

import { spawn }  from 'child_process';
import path       from 'path';
import { fileURLToPath } from 'url';

import logger from '../../utils/logger.js';
import { fetchDroughtWeatherData } from './openMeteoDroughtApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Path to the Python prediction script
const PREDICT_SCRIPT = path.resolve(
  __dirname,
  '../../ml/prediction/predict_drought.py'
);

// Python executable — prefer python3 on Unix, python on Windows
const PYTHON_EXEC = process.platform === 'win32' ? 'python' : 'python3';

// Timeout for the Python subprocess (ms)
const SUBPROCESS_TIMEOUT_MS = 60_000;


/**
 * runPythonPredictor
 *
 * Spawns the Python prediction script and returns the parsed JSON result.
 *
 * @param {string} district
 * @param {string} tehsil
 * @param {object|null} openMeteoData  - parsed Open-Meteo daily data object
 * @returns {Promise<object>}
 */
async function runPythonPredictor(district, tehsil, openMeteoData = null) {
  return new Promise((resolve, reject) => {
    const args = [
      PREDICT_SCRIPT,
      '--district', district,
      '--tehsil',   tehsil,
    ];

    if (openMeteoData) {
      args.push('--open_meteo_json', JSON.stringify(openMeteoData));
    }

    logger.info(`[DROUGHT_SVC] Spawning: ${PYTHON_EXEC} predict_drought.py --district "${district}" --tehsil "${tehsil}"`);

    const child = spawn(PYTHON_EXEC, args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });

    // Timeout guard
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(Object.assign(new Error('Python predictor timed out'), { code: 'PYTHON_TIMEOUT' }));
    }, SUBPROCESS_TIMEOUT_MS);

    child.on('close', code => {
      clearTimeout(timer);
      logger.debug(`[DROUGHT_SVC] Python exit code: ${code}`);
      if (stderr) logger.debug(`[DROUGHT_SVC] Python stderr:\n${stderr}`);

      // Parse stdout as JSON
      const raw = stdout.trim();
      if (!raw) {
        return reject(Object.assign(
          new Error('Python predictor returned empty output'),
          { code: 'PYTHON_EMPTY_OUTPUT' }
        ));
      }

      let parsed;
      try {
        // The script outputs exactly one JSON line
        const jsonLine = raw.split('\n').find(l => l.trim().startsWith('{'));
        parsed = JSON.parse(jsonLine ?? raw);
      } catch (e) {
        logger.error(`[DROUGHT_SVC] Failed to parse Python output: ${raw.slice(0, 500)}`);
        return reject(Object.assign(
          new Error('Python predictor returned invalid JSON'),
          { code: 'PYTHON_INVALID_OUTPUT' }
        ));
      }

      // Check for error payload from Python
      if (parsed.error) {
        const errCode = parsed.error;
        const errMsg  = parsed.message ?? 'Python prediction error';
        return reject(Object.assign(new Error(errMsg), { code: errCode }));
      }

      if (code !== 0) {
        return reject(Object.assign(
          new Error(`Python predictor exited with code ${code}`),
          { code: 'PYTHON_ERROR' }
        ));
      }

      resolve(parsed);
    });

    child.on('error', err => {
      clearTimeout(timer);
      logger.error(`[DROUGHT_SVC] Failed to spawn Python: ${err.message}`);
      reject(Object.assign(err, { code: 'PYTHON_SPAWN_ERROR' }));
    });
  });
}


/**
 * predictDrought
 *
 * Main service method called by the controller.
 *
 * @param {string} district
 * @param {string} tehsil
 * @param {object} options
 * @param {boolean} [options.useOpenMeteo=true]
 * @param {boolean} [options.saveToDb=false]   — set true when DB table exists
 * @returns {Promise<object>}
 */
export async function predictDrought(district, tehsil, options = {}) {
  const { useOpenMeteo = true } = options;

  if (!district?.trim()) throw Object.assign(new Error('District is required'), { code: 'MISSING_DISTRICT' });
  if (!tehsil?.trim())   throw Object.assign(new Error('Tehsil is required'),   { code: 'MISSING_TEHSIL'   });

  let openMeteoData = null;
  let openMeteoError = null;

  // ── Fetch Open-Meteo data (best-effort; failure doesn't block prediction) ──
  if (useOpenMeteo) {
    try {
      // We fetch coords from the Python side, but we need them here for OM.
      // For now, use district centroid from env or a hardcoded Vidarbha average.
      // The Python script will use precise tehsil coords for feature engineering.
      // We pass OM data as JSON; Python will match by date.

      // TODO: retrieve tehsil coords from DB for OM fetch.
      // For now, pass null lat/lng so OM data fetch is skipped until
      // the DB tables are queried from within Node. The Python script
      // has access to the processed CSV for coords.
      logger.info(`[DROUGHT_SVC] Open-Meteo fetch skipped (tehsil coords resolved in Python)`);
    } catch (err) {
      openMeteoError = err.message;
      logger.warn(`[DROUGHT_SVC] Open-Meteo fetch failed (non-fatal): ${err.message}`);
    }
  }

  // ── Run Python inference ──────────────────────────────────────────────────
  const prediction = await runPythonPredictor(district, tehsil, openMeteoData);
  if (openMeteoError) {
    prediction.open_meteo_warning = openMeteoError;
  }

  return prediction;
}


/**
 * fetchRecentWeatherForTehsil
 *
 * Utility: fetch Open-Meteo historical data for a known lat/lng.
 * Can be called separately if coords are known upfront.
 */
export async function fetchRecentWeatherForTehsil(lat, lng, lookbackDays = 90) {
  return fetchDroughtWeatherData(lat, lng, lookbackDays);
}
