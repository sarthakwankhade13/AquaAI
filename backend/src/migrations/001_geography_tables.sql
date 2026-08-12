-- ============================================================
--  AquaAI — Geography Master Data Migration
--  Migration: 001_geography_tables.sql
--  Run this manually in MySQL before starting the sync.
-- ============================================================

-- ── Districts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
  id                    INT UNSIGNED       NOT NULL AUTO_INCREMENT,
  official_district_code VARCHAR(20)       NOT NULL,
  district_name         VARCHAR(120)       NOT NULL,
  region                VARCHAR(80)        NOT NULL DEFAULT 'Vidarbha',
  state                 VARCHAR(80)        NOT NULL DEFAULT 'Maharashtra',
  status                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at            DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_official_district_code (official_district_code),
  KEY idx_district_status (status),
  KEY idx_district_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Talukas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS talukas (
  id                    INT UNSIGNED       NOT NULL AUTO_INCREMENT,
  official_taluka_code  VARCHAR(20)        NOT NULL,
  district_id           INT UNSIGNED       NOT NULL,
  taluka_name           VARCHAR(120)       NOT NULL,
  status                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at            DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_official_taluka_code (official_taluka_code),
  KEY idx_taluka_district (district_id),
  KEY idx_taluka_status (status),
  CONSTRAINT fk_taluka_district
    FOREIGN KEY (district_id) REFERENCES districts (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Villages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS villages (
  id                    INT UNSIGNED       NOT NULL AUTO_INCREMENT,
  official_village_code VARCHAR(20)        NOT NULL,
  taluka_id             INT UNSIGNED       NOT NULL,
  village_name          VARCHAR(160)       NOT NULL,
  village_local_name    VARCHAR(160)           NULL,
  status                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at            DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_official_village_code (official_village_code),
  KEY idx_village_taluka (taluka_id),
  KEY idx_village_status (status),
  KEY idx_village_name (village_name),
  CONSTRAINT fk_village_taluka
    FOREIGN KEY (taluka_id) REFERENCES talukas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
