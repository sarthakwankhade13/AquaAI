-- ============================================================
--  AquaAI — Drought Prediction History Table
--  Migration: 003_drought_tables.sql
--  Run after 002_weather_tables.sql
-- ============================================================

-- ── Drought Prediction History ────────────────────────────────
CREATE TABLE IF NOT EXISTS drought_predictions (
  id                    INT UNSIGNED         NOT NULL AUTO_INCREMENT,

  -- Location
  district              VARCHAR(120)         NOT NULL,
  tehsil                VARCHAR(120)         NOT NULL,
  latitude              DECIMAL(10,8)            NULL,
  longitude             DECIMAL(11,8)            NULL,

  -- Prediction output
  prediction_date       DATETIME             NOT NULL COMMENT 'Date/time prediction was requested',
  drought_prediction    ENUM('DROUGHT','NO DROUGHT') NOT NULL,
  probability           DECIMAL(5,4)         NOT NULL COMMENT '0.0000 - 1.0000',
  confidence            ENUM('HIGH','MEDIUM','LOW') NOT NULL,
  spi_3_value           DECIMAL(6,4)             NULL COMMENT 'SPI-3 value at prediction time',

  -- Per-model outputs (JSON)
  model_outputs         JSON                 NOT NULL COMMENT '{"random_forest":{...},...}',

  -- Ensemble result
  ensemble_probability  DECIMAL(5,4)         NOT NULL,

  -- Important factors
  important_factors     JSON                     NULL COMMENT '[{"feature":"...","impact":"high"},...]',

  -- Feature values used
  feature_values        JSON                     NULL COMMENT 'Key features used for this prediction',

  -- Data source flags
  used_historical_data  TINYINT(1)           NOT NULL DEFAULT 1,
  used_open_meteo       TINYINT(1)           NOT NULL DEFAULT 0,
  open_meteo_date_range JSON                     NULL COMMENT '{"start":"...","end":"..."}',

  -- Audit
  created_at            DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_drought_district (district),
  KEY idx_drought_tehsil   (tehsil),
  KEY idx_drought_pred_date (prediction_date),
  KEY idx_drought_result   (drought_prediction),
  KEY idx_drought_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
