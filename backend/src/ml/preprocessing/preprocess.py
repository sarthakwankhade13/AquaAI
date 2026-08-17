"""
preprocess.py — AquaAI Drought Prediction Pipeline
====================================================
Responsible for:
  1. Loading and profiling the raw rainfall CSV
  2. Cleaning (dates, nulls, duplicates, outliers)
  3. Aggregating to monthly totals per tehsil
  4. Computing a complete daily time grid per tehsil (filling 0 on dry days)
  5. Computing SPI-3 drought target (training data only)
  6. Feature engineering (rolling sums, lags, anomalies, temporal)
  7. Chronological train/val/test split
  8. Saving processed artefacts

Run directly:  python preprocess.py
Imported by:  train_drought_models.py, predict_drought.py
"""

import os
import sys
import json
import warnings
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")

# ─── Paths ───────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).resolve().parents[2]          # backend/src
ML_DIR     = ROOT / "ml"
RAW_CSV    = ROOT / "models" / "rainfall_vidarbha_filtered.csv"
PROC_DIR   = ML_DIR / "data" / "processed"
MODELS_DIR = ML_DIR / "models"

PROC_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("preprocess")

# ─── Constants ───────────────────────────────────────────────────────────────
# Chronological split fractions
TRAIN_END_FRAC = 0.70
VAL_END_FRAC   = 0.85

# SPI drought threshold
SPI_DROUGHT_THRESHOLD = -1.0   # values < this → Drought

# Minimum months per tehsil required for SPI fitting
MIN_MONTHS_FOR_SPI = 18


# ═══════════════════════════════════════════════════════════════════════════════
# 1.  LOAD & PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

def load_raw(path: Path) -> pd.DataFrame:
    """Load CSV and print data profile."""
    log.info(f"Loading raw CSV: {path}")
    df = pd.read_csv(path, encoding="utf-8-sig")

    # Strip trailing spaces from column names
    df.columns = [c.strip() for c in df.columns]

    log.info("═" * 60)
    log.info("DATASET PROFILE")
    log.info("═" * 60)
    log.info(f"  Rows         : {len(df):,}")
    log.info(f"  Columns      : {len(df.columns)}")
    log.info(f"  Column names : {list(df.columns)}")
    log.info(f"  Dtypes       :\n{df.dtypes}")
    log.info(f"  Null counts  :\n{df.isnull().sum()}")
    log.info(f"  Duplicate rows: {df.duplicated().sum()}")
    log.info("═" * 60)
    return df


# ═══════════════════════════════════════════════════════════════════════════════
# 2.  CLEAN
# ═══════════════════════════════════════════════════════════════════════════════

def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the raw dataframe."""
    log.info("Cleaning dataset …")

    # ── Rename columns for convenience ──────────────────────────────────────
    df = df.rename(columns={
        "Station"                 : "station",
        "District LGD Code"       : "district_lgd_code",
        "District"                : "district",
        "Tehsil"                  : "tehsil",
        "Latitude"                : "latitude",
        "Longitude"               : "longitude",
        "Data Acquisition Time"   : "date_raw",
        "Manual Daily Rainfall (mm)": "rainfall_mm",
    })

    # Drop completely-empty columns
    before = len(df.columns)
    df = df.dropna(axis=1, how="all")
    log.info(f"  Dropped {before - len(df.columns)} fully-empty column(s).")

    # ── Parse dates (mixed format) ──────────────────────────────────────────
    def parse_date(val):
        try:
            return pd.to_datetime(val, dayfirst=True)
        except Exception:
            return pd.NaT

    df["date"] = df["date_raw"].apply(parse_date)
    invalid_dates = df["date"].isna().sum()
    log.info(f"  Invalid dates : {invalid_dates}")
    df = df[df["date"].notna()].copy()

    # Keep only date portion (strip time)
    df["date"] = df["date"].dt.normalize()

    # ── Numeric conversion & validation ─────────────────────────────────────
    df["rainfall_mm"] = pd.to_numeric(df["rainfall_mm"], errors="coerce")
    df["latitude"]    = pd.to_numeric(df["latitude"],    errors="coerce")
    df["longitude"]   = pd.to_numeric(df["longitude"],   errors="coerce")

    # Drop rows where rainfall is null
    before = len(df)
    df = df[df["rainfall_mm"].notna()].copy()
    log.info(f"  Dropped {before - len(df)} rows with null rainfall.")

    # Clamp negative rainfall to 0 (instrument error)
    neg = (df["rainfall_mm"] < 0).sum()
    if neg:
        log.info(f"  Clamped {neg} negative rainfall values to 0.")
        df["rainfall_mm"] = df["rainfall_mm"].clip(lower=0)

    # ── Outlier flag (> 400 mm/day is meteorologically extreme for Vidarbha) ─
    EXTREME_THRESHOLD = 400.0
    extreme = (df["rainfall_mm"] > EXTREME_THRESHOLD).sum()
    if extreme:
        log.warning(f"  {extreme} rows have rainfall > {EXTREME_THRESHOLD} mm/day — keeping but flagging.")
        df["is_extreme"] = df["rainfall_mm"] > EXTREME_THRESHOLD
    else:
        df["is_extreme"] = False

    # ── Normalise text columns ──────────────────────────────────────────────
    df["district"] = df["district"].str.strip().str.title()
    df["tehsil"]   = df["tehsil"].str.strip().str.upper()
    df["station"]  = df["station"].str.strip()

    # ── Deduplication ───────────────────────────────────────────────────────
    # Keep last record for same station+date (most recent acquisition)
    before = len(df)
    df = df.drop_duplicates(subset=["station", "date"], keep="last")
    log.info(f"  Removed {before - len(df)} duplicate station+date rows.")

    # ── Sort ────────────────────────────────────────────────────────────────
    df = df.sort_values(["district", "tehsil", "station", "date"]).reset_index(drop=True)

    # ── Date range ──────────────────────────────────────────────────────────
    log.info(f"  Date range    : {df['date'].min().date()} → {df['date'].max().date()}")
    log.info(f"  Unique districts : {sorted(df['district'].unique())}")
    log.info(f"  Unique tehsils   : {len(df['tehsil'].unique())}")

    return df


# ═══════════════════════════════════════════════════════════════════════════════
# 3.  AGGREGATE TO DAILY PER TEHSIL
# ═══════════════════════════════════════════════════════════════════════════════

def aggregate_tehsil_daily(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate station-level daily rainfall to tehsil-level daily rainfall.
    For each tehsil+date, take the mean of all stations reporting that day.
    Then build a complete date grid (filling 0 for days with no reports).
    """
    log.info("Aggregating to daily per tehsil …")

    # Take the mean of all stations in a tehsil on the same day
    daily = (
        df.groupby(["district", "tehsil", "date"])
        .agg(
            rainfall_mm       = ("rainfall_mm", "mean"),
            station_count     = ("station",     "count"),
            latitude          = ("latitude",    "first"),
            longitude         = ("longitude",   "first"),
            district_lgd_code = ("district_lgd_code", "first"),
        )
        .reset_index()
    )

    # Build a complete daily grid per tehsil
    min_date = daily["date"].min()
    max_date = daily["date"].max()
    full_dates = pd.date_range(min_date, max_date, freq="D")

    tehsil_meta = (
        daily[["district", "tehsil", "latitude", "longitude", "district_lgd_code"]]
        .drop_duplicates(subset=["tehsil"])
    )

    complete_frames = []
    for _, row in tehsil_meta.iterrows():
        tehsil_df = pd.DataFrame({"date": full_dates})
        tehsil_df["district"]          = row["district"]
        tehsil_df["tehsil"]            = row["tehsil"]
        tehsil_df["latitude"]          = row["latitude"]
        tehsil_df["longitude"]         = row["longitude"]
        tehsil_df["district_lgd_code"] = row["district_lgd_code"]
        complete_frames.append(tehsil_df)

    grid = pd.concat(complete_frames, ignore_index=True)
    grid = grid.merge(
        daily[["district", "tehsil", "date", "rainfall_mm", "station_count"]],
        on=["district", "tehsil", "date"],
        how="left",
    )

    # Days with no station report → 0 mm (dry day)
    grid["rainfall_mm"]    = grid["rainfall_mm"].fillna(0.0)
    grid["station_count"]  = grid["station_count"].fillna(0).astype(int)
    grid["has_observation"]= grid["station_count"] > 0

    log.info(f"  Grid shape after tehsil expansion: {grid.shape}")
    return grid.sort_values(["district", "tehsil", "date"]).reset_index(drop=True)


# ═══════════════════════════════════════════════════════════════════════════════
# 4.  FEATURE ENGINEERING
# ═══════════════════════════════════════════════════════════════════════════════

def _get_season(m: int) -> int:
    """Map calendar month → meteorological season index (module-level to avoid loop redefinition)."""
    if m in (6, 7, 8, 9):  return 0   # Kharif/Monsoon
    if m in (10, 11):       return 1   # Post-monsoon
    if m in (12, 1, 2):     return 2   # Winter
    return 3                            # Pre-monsoon (Mar-May)


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add rainfall-based features. All rolling/lag windows use shift(1) to
    avoid target leakage (i.e., never include the current day in past windows)."""
    log.info("Engineering features …")

    result = []
    for tehsil_key, grp in df.groupby(["district", "tehsil"], sort=False):
        g = grp.sort_values("date").copy()
        r = g["rainfall_mm"]

        # ── Rolling sums (look-back, shifted by 1 day to avoid leakage) ──
        g["rain_7d"]  = r.shift(1).rolling(7,  min_periods=1).sum()
        g["rain_14d"] = r.shift(1).rolling(14, min_periods=1).sum()
        g["rain_30d"] = r.shift(1).rolling(30, min_periods=1).sum()
        g["rain_60d"] = r.shift(1).rolling(60, min_periods=1).sum()

        # ── Rolling means ─────────────────────────────────────────────────
        g["rain_7d_ma"]  = r.shift(1).rolling(7,  min_periods=1).mean()
        g["rain_30d_ma"] = r.shift(1).rolling(30, min_periods=1).mean()

        # ── Lag values ────────────────────────────────────────────────────
        g["rain_lag1"]  = r.shift(1)
        g["rain_lag3"]  = r.shift(3)
        g["rain_lag7"]  = r.shift(7)
        g["rain_lag14"] = r.shift(14)
        g["rain_lag30"] = r.shift(30)

        # ── Temporal features ─────────────────────────────────────────────
        g["month"]      = g["date"].dt.month
        g["year"]       = g["date"].dt.year
        g["day_of_year"]= g["date"].dt.dayofyear

        g["season"] = g["month"].map(_get_season)

        # ── Cumulative seasonal rainfall (resets each monsoon season start) ──
        g["cumulative_seasonal"] = (
            g.groupby(g["year"])["rainfall_mm"]
            .transform(lambda x: x.shift(1).cumsum())
            .fillna(0)
        )

        # ── Monthly rainfall (for SPI computation later) ──────────────────
        g["year_month"] = g["date"].dt.to_period("M")

        result.append(g)

    out = pd.concat(result, ignore_index=True).sort_values(
        ["district", "tehsil", "date"]
    ).reset_index(drop=True)

    log.info(f"  Feature engineering done. Columns: {list(out.columns)}")
    return out


# ═══════════════════════════════════════════════════════════════════════════════
# 5.  SPI-3 DROUGHT TARGET
# ═══════════════════════════════════════════════════════════════════════════════

def compute_spi3(df: pd.DataFrame, train_mask: pd.Series) -> pd.DataFrame:
    """
    Compute SPI-3 (3-month SPI) per tehsil.

    Steps:
      1. Aggregate daily rainfall → monthly totals per tehsil
      2. Compute 3-month rolling sum
      3. Fit gamma distribution PER CALENDAR MONTH, PER TEHSIL, on TRAINING data only
      4. Transform all data using those training-fitted parameters
      5. SPI < SPI_DROUGHT_THRESHOLD → Drought = 1

    NOTE: Gamma fitting uses training rows only to prevent leakage.
    """
    log.info("Computing SPI-3 drought target …")

    # Monthly aggregation
    df["year_month"] = df["date"].dt.to_period("M")
    monthly = (
        df.groupby(["district", "tehsil", "year_month"])["rainfall_mm"]
        .sum()
        .reset_index()
        .rename(columns={"rainfall_mm": "monthly_rain"})
    )
    monthly["year_month_dt"] = pd.PeriodIndex(monthly["year_month"]).to_timestamp()
    monthly = monthly.sort_values(["tehsil", "year_month_dt"])

    # 3-month rolling sum per tehsil
    monthly["rain_3m"] = (
        monthly.groupby("tehsil")["monthly_rain"]
        .transform(lambda x: x.rolling(3, min_periods=3).sum())
    )

    # Map train/val/test flag to monthly rows
    train_months = df[train_mask][["tehsil", "year_month"]].drop_duplicates()
    train_months["is_train"] = True
    monthly = monthly.merge(train_months, on=["tehsil", "year_month"], how="left")
    monthly["is_train"] = monthly["is_train"].fillna(False)
    monthly["calendar_month"] = monthly["year_month_dt"].dt.month

    # Fit & transform SPI per tehsil × calendar month
    monthly["spi_3"] = np.nan
    monthly["drought_label"] = np.nan

    gamma_params = {}  # stored for inference

    for tehsil, t_grp in monthly.groupby("tehsil"):
        train_t = t_grp[t_grp["is_train"] & t_grp["rain_3m"].notna()]

        if len(train_t) < MIN_MONTHS_FOR_SPI:
            log.warning(f"  Tehsil '{tehsil}': only {len(train_t)} months — skipping SPI (insufficient data).")
            continue

        gamma_params[tehsil] = {}
        for cal_month, cm_grp in train_t.groupby("calendar_month"):
            rain_vals = cm_grp["rain_3m"].values
            # Gamma requires positive values; add small epsilon
            rain_vals = np.where(rain_vals <= 0, 1e-6, rain_vals)

            if len(rain_vals) < 3:
                continue
            try:
                fit_params = stats.gamma.fit(rain_vals, floc=0)
                gamma_params[tehsil][int(cal_month)] = fit_params
            except Exception as e:
                log.warning(f"  Gamma fit failed for {tehsil} month {cal_month}: {e}")
                continue

        # Vectorised SPI transform for this tehsil (avoids slow iterrows + .at[])
        for cal_m, fp in gamma_params[tehsil].items():
            cm_mask = (
                (monthly["tehsil"] == tehsil)
                & (monthly["calendar_month"] == cal_m)
                & monthly["rain_3m"].notna()
            )
            cm_idx = monthly.index[cm_mask]
            if len(cm_idx) == 0:
                continue
            rain_vals = np.maximum(monthly.loc[cm_idx, "rain_3m"].values, 1e-6)
            cdf_vals  = np.clip(stats.gamma.cdf(rain_vals, *fp), 1e-6, 1 - 1e-6)
            spi_vals  = stats.norm.ppf(cdf_vals)
            monthly.loc[cm_idx, "spi_3"]          = np.round(spi_vals, 4)
            monthly.loc[cm_idx, "drought_label"] = (spi_vals < SPI_DROUGHT_THRESHOLD).astype(int)

    # Save gamma parameters for inference
    gamma_params_serialisable = {
        tehsil: {
            str(m): list(p) for m, p in months.items()
        }
        for tehsil, months in gamma_params.items()
    }
    gamma_path = MODELS_DIR / "gamma_params.json"
    with open(gamma_path, "w") as f:
        json.dump(gamma_params_serialisable, f, indent=2)
    log.info(f"  Gamma parameters saved → {gamma_path}")

    # Merge SPI and drought_label back to daily df
    monthly_slim = monthly[["tehsil", "year_month", "spi_3", "drought_label", "rain_3m"]].copy()
    df = df.merge(monthly_slim, on=["tehsil", "year_month"], how="left")

    # Log drought class distribution
    valid = df["drought_label"].dropna()
    n_drought  = int((valid == 1).sum())
    n_normal   = int((valid == 0).sum())
    log.info(f"  Drought class distribution (daily rows):")
    log.info(f"    Drought  (1): {n_drought:,}  ({100*n_drought/len(valid):.1f}%)")
    log.info(f"    Normal   (0): {n_normal:,}  ({100*n_normal/len(valid):.1f}%)")
    log.info(f"    Unlabelled  : {df['drought_label'].isna().sum():,}")

    return df


# ═══════════════════════════════════════════════════════════════════════════════
# 6.  RAINFALL ANOMALY (fitted on training only)
# ═══════════════════════════════════════════════════════════════════════════════

def add_rainfall_anomaly(df: pd.DataFrame, train_mask: pd.Series) -> pd.DataFrame:
    """Rainfall anomaly = current rainfall minus climatological monthly mean.
    The mean is computed from TRAINING data only."""
    log.info("Computing rainfall anomaly …")

    train_df = df[train_mask].copy()
    clim = (
        train_df.groupby(["tehsil", "month"])["rainfall_mm"]
        .mean()
        .reset_index()
        .rename(columns={"rainfall_mm": "clim_mean"})
    )

    df = df.merge(clim, on=["tehsil", "month"], how="left")
    df["rain_anomaly"] = df["rainfall_mm"] - df["clim_mean"].fillna(0)
    df = df.drop(columns=["clim_mean"])
    return df


# ═══════════════════════════════════════════════════════════════════════════════
# 7.  ENCODE CATEGORICALS
# ═══════════════════════════════════════════════════════════════════════════════

def encode_categoricals(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Label-encode district and tehsil. Return encoding maps for inference."""
    log.info("Encoding categoricals …")
    district_map = {v: i for i, v in enumerate(sorted(df["district"].unique()))}
    tehsil_map   = {v: i for i, v in enumerate(sorted(df["tehsil"].unique()))}

    df["district_enc"] = df["district"].map(district_map)
    df["tehsil_enc"]   = df["tehsil"].map(tehsil_map)

    encoding_maps = {"district": district_map, "tehsil": tehsil_map}
    maps_path = MODELS_DIR / "encoding_maps.json"
    with open(maps_path, "w") as f:
        json.dump(encoding_maps, f, indent=2)
    log.info(f"  Encoding maps saved → {maps_path}")
    return df, encoding_maps


# ═══════════════════════════════════════════════════════════════════════════════
# 8.  TRAIN / VAL / TEST SPLIT
# ═══════════════════════════════════════════════════════════════════════════════

def chronological_split(df: pd.DataFrame) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Return boolean masks for train / val / test based on date quantiles."""
    dates = df["date"].sort_values().unique()
    n = len(dates)
    train_cutoff = dates[int(n * TRAIN_END_FRAC)]
    val_cutoff   = dates[int(n * VAL_END_FRAC)]

    train_mask = df["date"] <= train_cutoff
    val_mask   = (df["date"] > train_cutoff) & (df["date"] <= val_cutoff)
    test_mask  = df["date"] > val_cutoff

    log.info(f"  Train : {train_mask.sum():,} rows  (until {train_cutoff.date()})")
    log.info(f"  Val   : {val_mask.sum():,} rows  ({train_cutoff.date()} → {val_cutoff.date()})")
    log.info(f"  Test  : {test_mask.sum():,} rows  (after {val_cutoff.date()})")
    return train_mask, val_mask, test_mask


# ═══════════════════════════════════════════════════════════════════════════════
# 9.  MAIN PREPROCESSING PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

FEATURE_COLUMNS = [
    "rainfall_mm",
    "rain_7d",
    "rain_14d",
    "rain_30d",
    "rain_60d",
    "rain_7d_ma",
    "rain_30d_ma",
    "rain_lag1",
    "rain_lag3",
    "rain_lag7",
    "rain_lag14",
    "rain_lag30",
    "rain_anomaly",
    "cumulative_seasonal",
    "spi_3",
    "month",
    "year",
    "day_of_year",
    "season",
    "latitude",
    "longitude",
    "district_enc",
    "tehsil_enc",
]

TARGET_COLUMN = "drought_label"


def run_preprocessing() -> dict:
    """Full preprocessing pipeline. Returns artefact paths."""

    # Step 1 – Load
    raw = load_raw(RAW_CSV)

    # Step 2 – Clean
    clean_df = clean(raw)

    # Step 3 – Daily tehsil grid
    daily = aggregate_tehsil_daily(clean_df)

    # Step 4 – Feature engineering (no SPI yet, needs train mask first)
    daily = add_features(daily)

    # Step 5 – Chronological split masks
    train_mask, val_mask, test_mask = chronological_split(daily)

    # Step 6 – SPI-3 target (fitted on training only)
    daily = compute_spi3(daily, train_mask)

    # Step 7 – Rainfall anomaly (fitted on training only)
    daily = add_rainfall_anomaly(daily, train_mask)

    # Step 8 – Encode categoricals
    daily, enc_maps = encode_categoricals(daily)

    # Step 9 – Filter to rows with a valid drought label
    labelled = daily[daily[TARGET_COLUMN].notna()].copy()
    labelled.loc[:, TARGET_COLUMN] = labelled[TARGET_COLUMN].astype(int)

    log.info(f"Labelled rows available for modelling: {len(labelled):,}")

    # Recompute split masks on labelled subset
    dates_l = labelled["date"].sort_values().unique()
    n = len(dates_l)
    tc = dates_l[int(n * TRAIN_END_FRAC)]
    vc = dates_l[int(n * VAL_END_FRAC)]
    train_l = labelled["date"] <= tc
    val_l   = (labelled["date"] > tc) & (labelled["date"] <= vc)
    test_l  = labelled["date"] > vc

    # Step 10 – Save processed artefacts
    labelled.to_csv(PROC_DIR / "processed_daily.csv", index=False)

    split_info = {
        "train_end_date"  : str(tc.date()),
        "val_end_date"    : str(vc.date()),
        "train_rows"      : int(train_l.sum()),
        "val_rows"        : int(val_l.sum()),
        "test_rows"       : int(test_l.sum()),
        "drought_threshold_spi": SPI_DROUGHT_THRESHOLD,
    }
    with open(PROC_DIR / "split_info.json", "w") as f:
        json.dump(split_info, f, indent=2)

    # Save feature columns list
    fc_path = MODELS_DIR / "feature_columns.json"
    with open(fc_path, "w") as f:
        json.dump({"features": FEATURE_COLUMNS, "target": TARGET_COLUMN}, f, indent=2)
    log.info(f"  Feature columns saved → {fc_path}")

    log.info("Preprocessing complete.")
    return {
        "processed_csv"  : str(PROC_DIR / "processed_daily.csv"),
        "feature_columns": FEATURE_COLUMNS,
        "target_column"  : TARGET_COLUMN,
        "split_info"     : split_info,
        "encoding_maps"  : enc_maps,
        "labelled_df"    : labelled,
        "train_mask"     : train_l,
        "val_mask"       : val_l,
        "test_mask"      : test_l,
    }


if __name__ == "__main__":
    artefacts = run_preprocessing()
    log.info(f"\nSplit info:\n{json.dumps(artefacts['split_info'], indent=2)}")
