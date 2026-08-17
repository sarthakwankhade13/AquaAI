"""
train_drought_models.py — AquaAI Drought Prediction
====================================================
Full training pipeline:

  1. Run preprocessing (preprocess.py)
  2. Prepare feature matrix X and target y
  3. Train three classifiers with chronological split
     - Model 1: Random Forest
     - Model 2: XGBoost
     - Model 3: HistGradientBoostingClassifier
  4. Evaluate on validation set (recall-prioritised)
  5. Compute ensemble weights from validation F1 (drought class)
  6. Evaluate ensemble on test set
  7. Save model artefacts + metadata report

Usage:
    cd backend/src/ml/training
    python train_drought_models.py

    OR from project root:
    python backend/src/ml/training/train_drought_models.py
"""

import sys
import os
import json
import logging
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
from sklearn.pipeline import Pipeline

warnings.filterwarnings("ignore")

# ─── Path setup ──────────────────────────────────────────────────────────────
TRAINING_DIR = Path(__file__).resolve().parent
ML_DIR       = TRAINING_DIR.parent
PREPROCESSING_DIR = ML_DIR / "preprocessing"
MODELS_DIR   = ML_DIR / "models"
PROC_DIR     = ML_DIR / "data" / "processed"

sys.path.insert(0, str(PREPROCESSING_DIR))
from preprocess import run_preprocessing, FEATURE_COLUMNS, TARGET_COLUMN

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("train")


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def get_metrics(y_true, y_pred, y_prob=None) -> dict:
    """Compute classification metrics. Drought = positive class (1)."""
    metrics = {
        "accuracy"         : round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_drought": round(float(precision_score(y_true, y_pred, pos_label=1, zero_division=0)), 4),
        "recall_drought"   : round(float(recall_score(y_true, y_pred, pos_label=1, zero_division=0)), 4),
        "f1_drought"       : round(float(f1_score(y_true, y_pred, pos_label=1, zero_division=0)), 4),
        "confusion_matrix" : confusion_matrix(y_true, y_pred).tolist(),
    }
    if y_prob is not None:
        try:
            metrics["roc_auc"] = round(float(roc_auc_score(y_true, y_prob)), 4)
        except Exception:
            metrics["roc_auc"] = None
    return metrics


def print_metrics_table(results: dict):
    """Pretty-print model comparison table."""
    log.info("\n" + "═" * 75)
    log.info(f"{'Model':<30} {'Acc':>6} {'Prec':>6} {'Recall':>7} {'F1':>6} {'ROC-AUC':>8}")
    log.info("─" * 75)
    for name, m in results.items():
        log.info(
            f"{name:<30} "
            f"{m.get('accuracy', 0):>6.3f} "
            f"{m.get('precision_drought', 0):>6.3f} "
            f"{m.get('recall_drought', 0):>7.3f} "
            f"{m.get('f1_drought', 0):>6.3f} "
            f"{m.get('roc_auc', 0) or 0:>8.3f}"
        )
    log.info("═" * 75)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE PREP
# ═══════════════════════════════════════════════════════════════════════════════

def prepare_Xy(df: pd.DataFrame, mask: pd.Series, feature_cols: list, target_col: str):
    """Select features and target for a given split mask."""
    subset = df[mask].dropna(subset=feature_cols + [target_col]).copy()
    X = subset[feature_cols].astype(float).values
    y = np.array(subset[target_col].astype(int).values, dtype=int)
    return X, y, subset


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

def build_models(class_weight_dict: dict) -> dict:
    """Return three untrained classifier pipelines."""

    try:
        import xgboost as xgb
        xgb_model = xgb.XGBClassifier(
            n_estimators     = 300,
            max_depth        = 6,
            learning_rate    = 0.05,
            subsample        = 0.8,
            colsample_bytree = 0.8,
            min_child_weight = 5,
            gamma            = 1,
            scale_pos_weight = class_weight_dict.get(1, 1) / max(class_weight_dict.get(0, 1), 1),
            eval_metric      = "logloss",
            random_state     = 42,
            n_jobs           = -1,
        )
    except ImportError:
        log.warning("XGBoost not available — using GradientBoostingClassifier instead.")
        from sklearn.ensemble import GradientBoostingClassifier
        xgb_model = GradientBoostingClassifier(
            n_estimators  = 300,
            max_depth     = 5,
            learning_rate = 0.05,
            subsample     = 0.8,
            random_state  = 42,
        )

    models = {
        "random_forest": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(
                n_estimators = 300,
                max_depth    = None,
                min_samples_split = 10,
                min_samples_leaf  = 5,
                class_weight = "balanced",
                random_state = 42,
                n_jobs       = -1,
            )),
        ]),

        "xgboost": xgb_model,

        "hist_gradient_boosting": HistGradientBoostingClassifier(
            max_iter          = 300,
            max_depth         = 6,
            learning_rate     = 0.05,
            min_samples_leaf  = 20,
            class_weight      = "balanced",
            random_state      = 42,
        ),
    }
    return models


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE IMPORTANCE
# ═══════════════════════════════════════════════════════════════════════════════

def extract_feature_importance(model, model_name: str, feature_cols: list) -> list:
    """Extract feature importances from tree-based models."""
    try:
        if hasattr(model, "named_steps"):
            clf = model.named_steps["clf"]
        else:
            clf = model

        importances = None
        if hasattr(clf, "feature_importances_"):
            importances = clf.feature_importances_

        if importances is None:
            return []

        fi = sorted(
            zip(feature_cols, importances),
            key=lambda x: x[1],
            reverse=True,
        )
        return [{"feature": f, "importance": round(float(v), 6)} for f, v in fi]
    except Exception as e:
        log.warning(f"  Could not extract feature importance for {model_name}: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# ENSEMBLE
# ═══════════════════════════════════════════════════════════════════════════════

def ensemble_predict(models: dict, weights: dict, X: np.ndarray) -> tuple:
    """Soft-voting ensemble. Returns (binary_predictions, probabilities)."""
    weighted_probs = np.zeros(len(X))
    total_weight   = sum(weights.values())

    for name, model in models.items():
        w = weights.get(name, 1.0)
        try:
            probs = model.predict_proba(X)[:, 1]
        except Exception:
            probs = model.predict(X).astype(float)
        weighted_probs += (w / total_weight) * probs

    preds = (weighted_probs >= 0.5).astype(int)
    return preds, weighted_probs


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN TRAINING PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def train():
    log.info("═" * 60)
    log.info(" AquaAI Drought Prediction — Model Training")
    log.info("═" * 60)

    # ── Step 1: Preprocessing ─────────────────────────────────────────────
    artefacts = run_preprocessing()
    df         = artefacts["labelled_df"]
    feat_cols  = artefacts["feature_columns"]
    tgt_col    = artefacts["target_column"]
    train_mask = artefacts["train_mask"]
    val_mask   = artefacts["val_mask"]
    test_mask  = artefacts["test_mask"]
    split_info = artefacts["split_info"]

    # ── Step 2: Feature matrices ──────────────────────────────────────────
    X_train, y_train, _ = prepare_Xy(df, train_mask, feat_cols, tgt_col)
    X_val,   y_val,   _ = prepare_Xy(df, val_mask,   feat_cols, tgt_col)
    X_test,  y_test,  _ = prepare_Xy(df, test_mask,  feat_cols, tgt_col)

    log.info(f"\nTraining samples  : {len(X_train):,}")
    log.info(f"Validation samples: {len(X_val):,}")
    log.info(f"Test samples      : {len(X_test):,}")
    log.info(f"Drought prevalence (train): {y_train.mean()*100:.1f}%")

    if len(X_train) < 50:
        log.error("INSUFFICIENT TRAINING DATA (<50 samples). Cannot train reliable models. Stopping.")
        sys.exit(1)

    # ── Step 3: Class weights ─────────────────────────────────────────────
    classes = np.unique(y_train)
    cw = compute_class_weight("balanced", classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes.tolist(), cw.tolist()))
    log.info(f"Class weights: {class_weight_dict}")

    # ── Step 4: Build models ──────────────────────────────────────────────
    models = build_models(class_weight_dict)
    trained_models = {}
    val_metrics    = {}

    for name, model in models.items():
        log.info(f"\nTraining {name} …")
        try:
            model.fit(X_train, y_train)
            trained_models[name] = model

            # Validation metrics
            y_val_pred = model.predict(X_val)
            try:
                y_val_prob = model.predict_proba(X_val)[:, 1]
            except Exception:
                y_val_prob = None

            vm = get_metrics(y_val, y_val_pred, y_val_prob)
            val_metrics[name] = vm
            log.info(f"  Validation → Recall: {vm['recall_drought']:.3f}  F1: {vm['f1_drought']:.3f}  ROC-AUC: {vm.get('roc_auc', 'N/A')}")
            log.info(f"  Confusion matrix:\n{np.array(vm['confusion_matrix'])}")
        except Exception as e:
            log.error(f"  FAILED to train {name}: {e}")
            continue

    if not trained_models:
        log.error("All models failed to train. Stopping.")
        sys.exit(1)

    log.info("\n── Validation Results ──")
    print_metrics_table(val_metrics)

    # ── Step 5: Ensemble weights (based on val F1-drought) ────────────────
    weights = {}
    for name, vm in val_metrics.items():
        f1 = vm.get("f1_drought", 0)
        weights[name] = max(f1, 0.01)   # floor to avoid zero weight

    log.info(f"\nEnsemble weights (from val F1-drought): {weights}")

    # ── Step 6: Test evaluation ───────────────────────────────────────────
    test_metrics = {}
    for name, model in trained_models.items():
        y_test_pred = model.predict(X_test)
        try:
            y_test_prob = model.predict_proba(X_test)[:, 1]
        except Exception:
            y_test_prob = None
        test_metrics[name] = get_metrics(y_test, y_test_pred, y_test_prob)

    # Ensemble test
    ens_preds, ens_probs = ensemble_predict(trained_models, weights, X_test)
    ens_metrics = get_metrics(y_test, ens_preds, ens_probs)
    test_metrics["ensemble"] = ens_metrics

    log.info("\n── Test Results ──")
    print_metrics_table(test_metrics)

    # Reliability check
    best_recall = max(m.get("recall_drought", 0) for m in test_metrics.values())
    if best_recall < 0.40:
        log.warning(
            "\n⚠  WARNING: Best drought recall on test set is {:.1f}%. "
            "The model may NOT be reliable enough for production deployment.".format(best_recall * 100)
        )

    # ── Step 7: Feature importance ────────────────────────────────────────
    feature_importances = {}
    for name, model in trained_models.items():
        feature_importances[name] = extract_feature_importance(model, name, feat_cols)

    # ── Step 8: Save models ───────────────────────────────────────────────
    log.info("\nSaving model artefacts …")
    model_paths = {}
    for name, model in trained_models.items():
        path = MODELS_DIR / f"drought_{name}.pkl"
        joblib.dump(model, path)
        model_paths[name] = str(path)
        log.info(f"  Saved: {path}")

    # Save ensemble weights
    weights_path = MODELS_DIR / "ensemble_weights.json"
    with open(weights_path, "w") as f:
        json.dump(weights, f, indent=2)

    # ── Step 9: Save metadata ─────────────────────────────────────────────
    metadata = {
        "training_date"     : datetime.now().isoformat(),
        "dataset_file"      : "rainfall_vidarbha_filtered.csv",
        "dataset_version"   : "1.0",
        "target_definition" : {
            "method"           : "SPI-3 (3-month Standardized Precipitation Index)",
            "threshold"        : split_info["drought_threshold_spi"],
            "label_0"          : "No Drought (SPI-3 >= threshold)",
            "label_1"          : "Drought    (SPI-3 <  threshold)",
            "rationale"        : "Only rainfall data available. SPI-3 selected for 3.5-year dataset.",
            "limitation"       : "Short baseline (3.5 yrs) may affect SPI reliability. Treat predictions with caution.",
        },
        "features"          : feat_cols,
        "split_info"        : split_info,
        "validation_metrics": val_metrics,
        "test_metrics"      : test_metrics,
        "ensemble_weights"  : weights,
        "feature_importance": feature_importances,
        "model_files"       : model_paths,
    }

    meta_path = MODELS_DIR / "model_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    log.info(f"  Metadata saved → {meta_path}")

    log.info("\n" + "═" * 60)
    log.info(" Training Complete")
    log.info(f" Models saved in: {MODELS_DIR}")
    log.info("═" * 60)
    return metadata


if __name__ == "__main__":
    meta = train()
