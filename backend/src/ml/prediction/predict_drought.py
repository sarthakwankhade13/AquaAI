"""
predict_drought.py — AquaAI Drought Prediction Inference
=========================================================
Loads trained models and generates a drought prediction for a
given district + tehsil, optionally enriched with Open-Meteo data.

Usage (CLI):
    python predict_drought.py --district "Akola" --tehsil "AKOLA"
    python predict_drought.py --district "Akola" --tehsil "AKOLA" --use_open_meteo

Called by Node.js droughtPredictionService.js via child_process.spawn.
Output: single JSON line to stdout.

Integration protocol:
  - Node.js passes: --district, --tehsil, [--open_meteo_json '<json>']
  - Script prints exactly ONE JSON line to stdout (no other prints)
  - All logs go to stderr
  - Exit code 0 = success, non-zero = failure
"""

import sys
import os
import json
import argparse
import logging
import warnings
from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import joblib

warnings.filterwarnings("ignore")

# ─── Paths ───────────────────────────────────────────────────────────────────
PREDICT_DIR = Path(__file__).resolve().parent
ML_DIR      = PREDICT_DIR.parent
MODELS_DIR  = ML_DIR / "models"
PROC_DIR    = ML_DIR / "data" / "processed"

sys.path.insert(0, str(ML_DIR / "preprocessing"))
from preprocess import FEATURE_COLUMNS, TARGET_COLUMN  # type: ignore[import]

# ─── Logging → stderr only (stdout reserved for JSON output) ─────────────────
log = logging.getLogger("predict")
log.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stderr)
handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
log.addHandler(handler)


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def load_artefacts() -> dict:
    """Load all trained models and supporting artefacts."""
    artefacts = {}

    # Models
    model_files = {
        "random_forest"         : MODELS_DIR / "drought_random_forest.pkl",
        "xgboost"               : MODELS_DIR / "drought_xgboost.pkl",
        "hist_gradient_boosting": MODELS_DIR / "drought_hist_gradient_boosting.pkl",
    }
    artefacts["models"] = {}
    for name, path in model_files.items():
        if path.exists():
            artefacts["models"][name] = joblib.load(path)
            log.info(f"Loaded model: {name}")
        else:
            log.warning(f"Model file not found: {path}")

    if not artefacts["models"]:
        raise FileNotFoundError(
            "No trained models found. Run train_drought_models.py first."
        )

    # Ensemble weights
    weights_path = MODELS_DIR / "ensemble_weights.json"
    if weights_path.exists():
        with open(weights_path) as f:
            artefacts["weights"] = json.load(f)
    else:
        artefacts["weights"] = {k: 1.0 for k in artefacts["models"]}
        log.warning("ensemble_weights.json not found — using equal weights.")

    # Encoding maps
    enc_path = MODELS_DIR / "encoding_maps.json"
    if enc_path.exists():
        with open(enc_path) as f:
            artefacts["encoding_maps"] = json.load(f)
    else:
        artefacts["encoding_maps"] = {"district": {}, "tehsil": {}}

    # Gamma parameters (for SPI-3 computation at inference)
    gamma_path = MODELS_DIR / "gamma_params.json"
    if gamma_path.exists():
        with open(gamma_path) as f:
            artefacts["gamma_params"] = json.load(f)
    else:
        artefacts["gamma_params"] = {}

    # Feature columns
    fc_path = MODELS_DIR / "feature_columns.json"
    if fc_path.exists():
        with open(fc_path) as f:
            d = json.load(f)
            artefacts["feature_columns"] = d.get("features", FEATURE_COLUMNS)
    else:
        artefacts["feature_columns"] = FEATURE_COLUMNS

    # Metadata
    meta_path = MODELS_DIR / "model_metadata.json"
    if meta_path.exists():
        with open(meta_path) as f:
            artefacts["metadata"] = json.load(f)
    else:
        artefacts["metadata"] = {}

    return artefacts


# ═══════════════════════════════════════════════════════════════════════════════
# COORDINATE LOOKUP
# ═══════════════════════════════════════════════════════════════════════════════

def get_tehsil_coords(district: str, tehsil: str) -> tuple[float, float]:
    """Get lat/lng from the processed CSV for a given tehsil."""
    proc_csv = PROC_DIR / "processed_daily.csv"
    if not proc_csv.exists():
        raise FileNotFoundError("processed_daily.csv not found. Run preprocessing first.")

    df = pd.read_csv(proc_csv, usecols=["district", "tehsil", "latitude", "longitude"])
    df["district"] = df["district"].str.strip().str.title()
    df["tehsil"]   = df["tehsil"].str.strip().str.upper()

    match = df[
        (df["district"] == district.strip().title()) &
        (df["tehsil"]   == tehsil.strip().upper())
    ]

    if match.empty:
        available_tehsils = df[df["district"] == district.strip().title()]["tehsil"].unique().tolist()
        raise ValueError(
            f"Tehsil '{tehsil}' not found in district '{district}'. "
            f"Available tehsils: {available_tehsils}"
        )

    lat = float(match["latitude"].iloc[0])
    lng = float(match["longitude"].iloc[0])
    log.info(f"Coordinates for {district}/{tehsil}: ({lat}, {lng})")
    return lat, lng


# ═══════════════════════════════════════════════════════════════════════════════
# HISTORICAL DATA RETRIEVAL
# ═══════════════════════════════════════════════════════════════════════════════

def get_historical_context(district: str, tehsil: str, days: int = 90) -> pd.DataFrame:
    """
    Get the last `days` days of historical rainfall for the tehsil.
    Used to compute rolling features for prediction.
    """
    proc_csv = PROC_DIR / "processed_daily.csv"
    if not proc_csv.exists():
        return pd.DataFrame()

    df = pd.read_csv(proc_csv, parse_dates=["date"])
    df["district"] = df["district"].str.strip().str.title()
    df["tehsil"]   = df["tehsil"].str.strip().str.upper()

    tehsil_df = df[
        (df["district"] == district.strip().title()) &
        (df["tehsil"]   == tehsil.strip().upper())
    ].sort_values("date")

    if tehsil_df.empty:
        log.warning(f"No historical data found for {district}/{tehsil}")
        return pd.DataFrame()

    return tehsil_df.tail(days)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE VECTOR CONSTRUCTION
# ═══════════════════════════════════════════════════════════════════════════════

def build_feature_vector(
    district       : str,
    tehsil         : str,
    lat            : float,
    lng            : float,
    historical_df  : pd.DataFrame,
    open_meteo_data: dict | None,
    artefacts      : dict,
    prediction_date: datetime = None,
) -> tuple[np.ndarray, dict]:
    """
    Build the feature vector for a single prediction.
    Merges historical project data with optional Open-Meteo recent data.
    Returns (feature_array, feature_debug_dict).
    """
    if prediction_date is None:
        prediction_date = datetime.now()

    feature_cols = artefacts["feature_columns"]
    enc_maps     = artefacts["encoding_maps"]
    gamma_params = artefacts["gamma_params"]

    # ── Combine historical + Open-Meteo daily data ──────────────────────
    # Start with historical rolling context
    if not historical_df.empty:
        hist_rain = historical_df.set_index("date")["rainfall_mm"]
    else:
        hist_rain = pd.Series(dtype=float)

    # Append Open-Meteo daily values if available
    open_meteo_used = False
    recent_rain_data = {}
    if open_meteo_data and "daily" in open_meteo_data:
        d = open_meteo_data["daily"]
        om_dates  = pd.to_datetime(d.get("time", []))
        om_rains  = d.get("precipitation_sum", d.get("rain_sum", [None] * len(om_dates)))
        if len(om_dates) > 0:
            om_series = pd.Series(om_rains, index=om_dates, dtype=float).dropna()
            # Only use PAST dates to avoid future leakage
            om_series = om_series[om_series.index < pd.Timestamp(prediction_date)]
            if len(om_series) > 0:
                hist_rain = pd.concat([hist_rain, om_series])
                hist_rain = hist_rain[~hist_rain.index.duplicated(keep="last")].sort_index()
                open_meteo_used = True
                recent_rain_data = {
                    "last_7d_mm"  : float(om_series.tail(7).sum()),
                    "last_30d_mm" : float(om_series.tail(30).sum()),
                    "source"      : "open_meteo",
                    "fetched_at"  : open_meteo_data.get("fetched_at", datetime.now().isoformat()),
                }
                log.info(f"Integrated {len(om_series)} Open-Meteo daily observations.")

    # ── Compute rolling features from the combined rain series ───────────
    r = hist_rain.sort_index()

    def rolling_sum(days):
        window = r[r.index < pd.Timestamp(prediction_date)].tail(days)
        return float(window.sum()) if len(window) > 0 else 0.0

    def lag_val(days):
        past = r[r.index < pd.Timestamp(prediction_date)]
        if len(past) >= days:
            return float(past.iloc[-days])
        return 0.0

    rain_7d   = rolling_sum(7)
    rain_14d  = rolling_sum(14)
    rain_30d  = rolling_sum(30)
    rain_60d  = rolling_sum(60)
    rain_today = rolling_sum(1)

    # ── SPI-3 inference ──────────────────────────────────────────────────
    spi_3_val = 0.0
    if tehsil.upper() in gamma_params:
        try:
            from scipy import stats as scipy_stats
            cal_month = prediction_date.month
            month_key = str(cal_month)
            tehsil_key = tehsil.upper()
            if month_key in gamma_params[tehsil_key]:
                fp = gamma_params[tehsil_key][month_key]
                # Get 3-month rolling sum
                rain_3m = rolling_sum(90)
                rain_3m = max(rain_3m, 1e-6)
                cdf_val = scipy_stats.gamma.cdf(rain_3m, *fp)
                cdf_val = float(np.clip(cdf_val, 1e-6, 1 - 1e-6))
                spi_3_val = float(scipy_stats.norm.ppf(cdf_val))
                spi_3_val = float(np.clip(spi_3_val, -4.0, 4.0))
        except Exception as e:
            log.warning(f"SPI-3 computation failed: {e}")

    # ── Temporal features ─────────────────────────────────────────────────
    month       = prediction_date.month
    year        = prediction_date.year
    day_of_year = prediction_date.timetuple().tm_yday

    def season(m):
        if m in [6, 7, 8, 9]: return 0
        if m in [10, 11]:      return 1
        if m in [12, 1, 2]:    return 2
        return 3

    # ── Anomaly (vs climatological mean from training) ────────────────────
    rain_anomaly = 0.0
    if not historical_df.empty and "rain_anomaly" in historical_df.columns:
        last_anomaly = historical_df["rain_anomaly"].dropna()
        if len(last_anomaly) > 0:
            rain_anomaly = float(last_anomaly.iloc[-1])

    cumulative_seasonal = rolling_sum(min(120, (prediction_date - datetime(year, 6, 1)).days + 1))

    # ── Encoding ──────────────────────────────────────────────────────────
    dist_enc   = enc_maps.get("district", {}).get(district.strip().title(), -1)
    tehsil_enc = enc_maps.get("tehsil",   {}).get(tehsil.strip().upper(), -1)

    # ── Build feature dict (must match FEATURE_COLUMNS order) ────────────
    feat_dict = {
        "rainfall_mm"        : rain_today,
        "rain_7d"            : rain_7d,
        "rain_14d"           : rain_14d,
        "rain_30d"           : rain_30d,
        "rain_60d"           : rain_60d,
        "rain_7d_ma"         : rain_7d / 7,
        "rain_30d_ma"        : rain_30d / 30,
        "rain_lag1"          : lag_val(1),
        "rain_lag3"          : lag_val(3),
        "rain_lag7"          : lag_val(7),
        "rain_lag14"         : lag_val(14),
        "rain_lag30"         : lag_val(30),
        "rain_anomaly"       : rain_anomaly,
        "cumulative_seasonal": cumulative_seasonal,
        "spi_3"              : spi_3_val,
        "month"              : month,
        "year"               : year,
        "day_of_year"        : day_of_year,
        "season"             : season(month),
        "latitude"           : lat,
        "longitude"          : lng,
        "district_enc"       : dist_enc,
        "tehsil_enc"         : tehsil_enc,
    }

    # Ensure order matches training
    X = np.array([feat_dict.get(c, 0.0) for c in feature_cols], dtype=float)
    X = np.nan_to_num(X, nan=0.0)

    feat_dict["open_meteo_used"] = open_meteo_used
    feat_dict["recent_rain_data"] = recent_rain_data

    return X.reshape(1, -1), feat_dict


# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION
# ═══════════════════════════════════════════════════════════════════════════════

def predict(district: str, tehsil: str, open_meteo_json: str | None = None) -> dict:
    """
    Main prediction function. Returns a structured dict ready for JSON output.
    """
    log.info(f"Predicting drought for {district} / {tehsil}")

    # ── Load artefacts ────────────────────────────────────────────────────
    artefacts = load_artefacts()
    models    = artefacts["models"]
    weights   = artefacts["weights"]
    feat_cols = artefacts["feature_columns"]

    # ── Coordinates ───────────────────────────────────────────────────────
    lat, lng = get_tehsil_coords(district, tehsil)

    # ── Historical context ────────────────────────────────────────────────
    hist_df = get_historical_context(district, tehsil, days=120)

    # ── Open-Meteo data ───────────────────────────────────────────────────
    open_meteo_data = None
    if open_meteo_json:
        try:
            open_meteo_data = json.loads(open_meteo_json)
        except Exception as e:
            log.warning(f"Failed to parse open_meteo_json: {e}")

    # ── Feature vector ────────────────────────────────────────────────────
    prediction_date = datetime.now()
    X, feat_debug = build_feature_vector(
        district        = district,
        tehsil          = tehsil,
        lat             = lat,
        lng             = lng,
        historical_df   = hist_df,
        open_meteo_data = open_meteo_data,
        artefacts       = artefacts,
        prediction_date = prediction_date,
    )

    # ── Per-model predictions ─────────────────────────────────────────────
    model_results = {}
    weighted_prob  = 0.0
    total_weight   = sum(weights.get(n, 1.0) for n in models)

    for name, model in models.items():
        w = weights.get(name, 1.0)
        try:
            pred_label = int(model.predict(X)[0])
            prob_arr   = model.predict_proba(X)[0]
            prob       = float(prob_arr[1])
        except Exception as e:
            log.warning(f"Prediction failed for {name}: {e}")
            pred_label = 0
            prob       = 0.0

        model_results[name] = {
            "prediction" : "DROUGHT" if pred_label == 1 else "NO DROUGHT",
            "probability": round(prob, 4),
        }
        weighted_prob += (w / total_weight) * prob

    # ── Ensemble ──────────────────────────────────────────────────────────
    ensemble_pred  = "DROUGHT" if weighted_prob >= 0.5 else "NO DROUGHT"
    ensemble_label = 1 if weighted_prob >= 0.5 else 0

    # Confidence bands
    def confidence_level(p):
        p = abs(p - 0.5)
        if p >= 0.3: return "HIGH"
        if p >= 0.15: return "MEDIUM"
        return "LOW"

    confidence = confidence_level(weighted_prob)

    # ── Feature importance for this prediction ────────────────────────────
    important_factors = []
    # Use the first available tree model's global importances
    meta = artefacts.get("metadata", {})
    fi_dict = meta.get("feature_importance", {})
    if fi_dict:
        first_model_fi = next(iter(fi_dict.values()), [])
        for item in first_model_fi[:8]:  # top 8
            f = item.get("feature", "")
            v = item.get("importance", 0)
            if v > 0.01:
                level = "high" if v > 0.1 else ("medium" if v > 0.04 else "low")
                important_factors.append({"feature": f, "importance": round(v, 4), "impact": level})

    # ── Assemble response ─────────────────────────────────────────────────
    result = {
        "district"        : district,
        "tehsil"          : tehsil,
        "prediction_date" : prediction_date.isoformat(),
        "prediction"      : ensemble_pred,
        "probability"     : round(weighted_prob, 4),
        "confidence"      : confidence,
        "models"          : model_results,
        "important_factors": important_factors,
        "data_source": {
            "historical"       : not hist_df.empty,
            "open_meteo"       : feat_debug.get("open_meteo_used", False),
            "open_meteo_detail": feat_debug.get("recent_rain_data", {}),
        },
        "feature_values": {
            "spi_3"   : round(feat_debug.get("spi_3", 0), 3),
            "rain_30d": round(feat_debug.get("rain_30d", 0), 1),
            "rain_7d" : round(feat_debug.get("rain_7d", 0), 1),
            "month"   : feat_debug.get("month"),
        },
        "coordinates": {"latitude": lat, "longitude": lng},
    }

    return result


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="AquaAI Drought Predictor")
    parser.add_argument("--district",        required=True,  help="District name (e.g. Akola)")
    parser.add_argument("--tehsil",          required=True,  help="Tehsil name  (e.g. AKOLA)")
    parser.add_argument("--open_meteo_json", default=None,   help="JSON string of Open-Meteo daily data")
    parser.add_argument("--pretty",          action="store_true", help="Pretty-print JSON output")
    args = parser.parse_args()

    try:
        result = predict(
            district        = args.district,
            tehsil          = args.tehsil,
            open_meteo_json = args.open_meteo_json,
        )
        indent = 2 if args.pretty else None
        # ── Output single JSON line to stdout ──
        print(json.dumps(result, indent=indent, default=str))
        sys.exit(0)

    except ValueError as e:
        error = {"error": "INVALID_LOCATION", "message": str(e)}
        print(json.dumps(error))
        sys.exit(2)

    except FileNotFoundError as e:
        error = {"error": "MODEL_NOT_FOUND", "message": str(e)}
        print(json.dumps(error))
        sys.exit(3)

    except Exception as e:
        error = {"error": "PREDICTION_FAILED", "message": str(e)}
        print(json.dumps(error))
        sys.exit(1)


if __name__ == "__main__":
    main()
