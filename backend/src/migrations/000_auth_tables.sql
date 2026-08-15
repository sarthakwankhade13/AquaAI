-- ============================================================
--  AquaAI — Core Authentication Tables Migration
--  Migration: 000_auth_tables.sql
--  Run this FIRST before any other migrations.
-- ============================================================

-- ── Roles Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  role_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (role_id),
  KEY idx_role_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default roles
INSERT INTO roles (role_name, description) VALUES
  ('WRD Super Admin', 'Water Resource Department Super Administrator'),
  ('WRD Admin', 'Water Resource Department Administrator'),
  ('WRD Officer', 'Water Resource Department Officer'),
  ('District Admin', 'District Level Administrator'),
  ('Taluka Admin', 'Taluka Level Administrator'),
  ('Village Head', 'Village Representative'),
  ('Farmer', 'Individual Farmer User'),
  ('Guest', 'Guest User with limited access')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ── Users Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  gender ENUM('Male', 'Female', 'Other'),
  profile_image_url VARCHAR(512),
  address VARCHAR(500),
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_email (email),
  UNIQUE KEY uq_mobile (mobile),
  KEY idx_role_id (role_id),
  KEY idx_user_active (is_active),
  KEY idx_created_at (created_at),
  CONSTRAINT fk_user_role
    FOREIGN KEY (role_id) REFERENCES roles (role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Refresh Tokens Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (token_id),
  KEY idx_user_id (user_id),
  KEY idx_expires_at (expires_at),
  KEY idx_is_revoked (is_revoked),
  CONSTRAINT fk_refresh_token_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Login History Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  history_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  login_time DATETIME NOT NULL,
  logout_time DATETIME,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  login_status ENUM('SUCCESS', 'FAILED', 'LOGOUT') NOT NULL DEFAULT 'SUCCESS',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (history_id),
  KEY idx_user_id (user_id),
  KEY idx_login_time (login_time),
  KEY idx_login_status (login_status),
  CONSTRAINT fk_login_history_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Password Reset OTP Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_otp (
  otp_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (otp_id),
  KEY idx_user_id (user_id),
  KEY idx_otp_code (otp_code),
  KEY idx_is_used (is_used),
  CONSTRAINT fk_password_reset_otp_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Audit Logs Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(100),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (log_id),
  KEY idx_user_id (user_id),
  KEY idx_action (action),
  KEY idx_module (module),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Seed WRD Super Admin User
--  Email: admin@wrd.gov.in
--  Password: admin123 (bcrypt hashed)
-- ============================================================

-- Insert WRD Super Admin user if it doesn't already exist
INSERT IGNORE INTO users (role_id, full_name, email, mobile, password, gender, address, is_verified, is_active, created_at, updated_at)
SELECT 
  r.role_id,
  'WRD Super Administrator',
  'admin@wrd.gov.in',
  '9876543210',
  '$2b$12$y5Pfn9MfVlEJEFUotWBwAezXOLgBD/GwCmZch3GJCcOipJhf2ZRhi',
  'Male',
  'Water Resource Department Head Office, Nagpur, Maharashtra',
  1,
  1,
  NOW(),
  NOW()
FROM roles r
WHERE r.role_name = 'WRD Super Admin';
