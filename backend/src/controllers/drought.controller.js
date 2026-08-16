/**
 * drought.controller.js
 *
 * Express controller for drought prediction endpoints.
 * Mounted under /api/v1/drought
 */

import logger from '../utils/logger.js';
import { predictDrought } from '../services/drought/droughtPredictionService.js';

// ── Error code → HTTP status mapping ──────────────────────────────────────────
const ERROR_STATUS = {
  MISSING_DISTRICT     : 400,
  MISSING_TEHSIL       : 400,
  INVALID_LOCATION     : 404,
  MODEL_NOT_FOUND      : 503,
  PYTHON_TIMEOUT       : 504,
  PYTHON_SPAWN_ERROR   : 503,
  PYTHON_ERROR         : 500,
  PYTHON_EMPTY_OUTPUT  : 500,
  PYTHON_INVALID_OUTPUT: 500,
  OPEN_METEO_TIMEOUT   : 200,   // Non-fatal; prediction still returns
  OPEN_METEO_RATE_LIMITED: 200,
};

/**
 * POST /api/v1/drought/predict
 *
 * Body: { "district": "Akola", "tehsil": "AKOLA" }
 */
export async function droughtPredict(req, res, next) {
  try {
    const { district, tehsil } = req.body;

    logger.info(`[DROUGHT_CTRL] Prediction request: district="${district}" tehsil="${tehsil}"`);

    // Basic input validation
    if (!district || typeof district !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'district is required and must be a string.',
      });
    }
    if (!tehsil || typeof tehsil !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'tehsil is required and must be a string.',
      });
    }

    const result = await predictDrought(district.trim(), tehsil.trim().toUpperCase());

    logger.info(
      `[DROUGHT_CTRL] Prediction complete: ${district}/${tehsil} => ${result.prediction} (${(result.probability * 100).toFixed(1)}%)`
    );

    return res.status(200).json({
      success: true,
      data   : result,
    });

  } catch (err) {
    const code   = err.code ?? 'UNKNOWN';
    const status = ERROR_STATUS[code] ?? 500;

    logger.error(`[DROUGHT_CTRL] Error [${code}]: ${err.message}`);

    // Don't reveal internal errors in production
    const message = (status < 500 || process.env.NODE_ENV !== 'production')
      ? err.message
      : 'An internal error occurred during drought prediction.';

    return res.status(status).json({
      success: false,
      code,
      message,
    });
  }
}

/**
 * GET /api/v1/drought/districts
 *
 * Returns list of available districts from the processed dataset.
 */
export async function getAvailableDistricts(req, res) {
  try {
    const { readFileSync, existsSync } = await import('fs');
    const { resolve, dirname }        = await import('path');
    const { fileURLToPath }           = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname  = dirname(__filename);
    const encPath    = resolve(__dirname, '../ml/models/encoding_maps.json');

    if (!existsSync(encPath)) {
      return res.status(503).json({
        success: false,
        message: 'ML models not yet trained. Run train_drought_models.py first.',
      });
    }

    const maps = JSON.parse(readFileSync(encPath, 'utf-8'));
    const districts = Object.keys(maps.district ?? {}).sort();

    return res.status(200).json({ success: true, data: { districts } });
  } catch (err) {
    logger.error(`[DROUGHT_CTRL] getAvailableDistricts: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to load district list.' });
  }
}

/**
 * GET /api/v1/drought/tehsils/:district
 *
 * Returns list of tehsils for a given district.
 */
export async function getTehsilsForDistrict(req, res) {
  try {
    const { district } = req.params;
    const { createReadStream } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath }    = await import('url');
    const readline             = await import('readline');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname  = dirname(__filename);
    const csvPath    = resolve(__dirname, '../ml/data/processed/processed_daily.csv');

    const { existsSync } = await import('fs');
    if (!existsSync(csvPath)) {
      return res.status(503).json({
        success: false,
        message: 'Processed data not available. Run preprocessing first.',
      });
    }

    // Read CSV and collect tehsils for district
    const tehsilSet = new Set();
    const rl = readline.createInterface({
      input: createReadStream(csvPath),
      crlfDelay: Infinity,
    });

    let headerParsed = false;
    let districtIdx  = -1;
    let tehsilIdx    = -1;

    for await (const line of rl) {
      const cols = line.split(',');
      if (!headerParsed) {
        districtIdx  = cols.indexOf('district');
        tehsilIdx    = cols.indexOf('tehsil');
        headerParsed = true;
        continue;
      }
      if (districtIdx >= 0 && tehsilIdx >= 0) {
        const d = cols[districtIdx]?.trim();
        const t = cols[tehsilIdx]?.trim();
        if (d?.toLowerCase() === district.toLowerCase()) {
          tehsilSet.add(t);
        }
      }
    }

    const tehsils = [...tehsilSet].sort();
    if (tehsils.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No tehsils found for district "${district}". Check spelling.`,
      });
    }

    return res.status(200).json({ success: true, data: { district, tehsils } });
  } catch (err) {
    logger.error(`[DROUGHT_CTRL] getTehsilsForDistrict: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Failed to load tehsil list.' });
  }
}

/**
 * GET /api/v1/drought/health
 *
 * Checks that model artefacts exist and are ready.
 */
export async function droughtHealthCheck(req, res) {
  try {
    const { existsSync } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname  = dirname(__filename);
    const modelsDir  = resolve(__dirname, '../ml/models');

    const required = [
      'drought_random_forest.pkl',
      'drought_xgboost.pkl',
      'drought_hist_gradient_boosting.pkl',
      'model_metadata.json',
      'feature_columns.json',
      'encoding_maps.json',
    ];

    const status = {};
    let allReady = true;
    for (const f of required) {
      const exists = existsSync(resolve(modelsDir, f));
      status[f] = exists ? 'ok' : 'missing';
      if (!exists) allReady = false;
    }

    return res.status(allReady ? 200 : 503).json({
      success: allReady,
      ready  : allReady,
      artefacts: status,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
