-- ============================================================
--  AquaAI — Weather Data Migration
--  Migration: 002_weather_tables.sql
--  Run this after 001_geography_tables.sql
-- ============================================================

-- Note: latitude and longitude columns should be added to villages table separately if needed

-- ── District coordinate centroids (lookup table) ─────────────
CREATE TABLE IF NOT EXISTS district_coordinates (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  district_name VARCHAR(120) NOT NULL,
  latitude      DECIMAL(10,8) NOT NULL,
  longitude     DECIMAL(11,8) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_district_coord_name (district_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Vidarbha district centroids (official approximate coordinates)
INSERT INTO district_coordinates (district_name, latitude, longitude) VALUES
  ('Nagpur',     21.14580, 79.08820),
  ('Wardha',     20.74530, 78.60220),
  ('Bhandara',   21.16670, 79.65000),
  ('Gondia',     21.46000, 80.19000),
  ('Chandrapur', 19.96150, 79.29610),
  ('Gadchiroli', 20.18090, 80.00000),
  ('Amravati',   20.93740, 77.77960),
  ('Akola',      20.70960, 77.00210),
  ('Buldhana',   20.52920, 76.18420),
  ('Washim',     20.11130, 77.13250),
  ('Yavatmal',   20.38880, 78.12040)
ON DUPLICATE KEY UPDATE
  latitude   = VALUES(latitude),
  longitude  = VALUES(longitude),
  updated_at = NOW();

-- ── Village weather cache table ───────────────────────────────
CREATE TABLE IF NOT EXISTS village_weather (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  village_id      INT UNSIGNED NOT NULL,

  latitude        DECIMAL(10,8) NOT NULL,
  longitude       DECIMAL(11,8) NOT NULL,

  temperature     FLOAT        NULL COMMENT 'Celsius, 2m above ground',
  humidity        FLOAT        NULL COMMENT 'Relative humidity %, 2m',
  rainfall        FLOAT        NULL COMMENT 'Rain mm, last hour',
  precipitation   FLOAT        NULL COMMENT 'Total precipitation mm, last hour',
  wind_speed      FLOAT        NULL COMMENT 'Wind speed km/h, 10m above ground',
  weather_code    INT          NULL COMMENT 'WMO weather interpretation code',

  forecast_data   JSON         NULL,

  fetched_at      DATETIME     NOT NULL COMMENT 'When Open-Meteo was last queried',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_village_weather (village_id),
  KEY idx_weather_fetched (fetched_at),
  CONSTRAINT fk_weather_village
    FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
