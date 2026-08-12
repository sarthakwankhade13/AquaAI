/**
 * geography.repository.js
 * Data-access layer for districts, talukas and villages tables.
 * All queries are parameterised. Uses UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
 * so the sync is fully idempotent.
 */

import { pool } from '../config/db.js';

// ═══════════════════════════════════════════════════════════════
//  DISTRICTS
// ═══════════════════════════════════════════════════════════════

/**
 * Upsert a district row.
 * Inserts on first run, updates district_name/status on subsequent runs.
 */
export const upsertDistrict = async ({ officialCode, name, region = 'Vidarbha', state = 'Maharashtra' }) => {
  const [result] = await pool.execute(
    `INSERT INTO districts (official_district_code, district_name, region, state, status)
     VALUES (?, ?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE
       district_name = VALUES(district_name),
       region        = VALUES(region),
       status        = 'active',
       updated_at    = NOW()`,
    [officialCode, name, region, state]
  );
  // insertId is 0 on UPDATE; fetch by code to get consistent id
  return getDistrictByCode(officialCode);
};

export const getAllDistricts = async () => {
  const [rows] = await pool.execute(
    `SELECT id, official_district_code, district_name, region, state, status, created_at, updated_at
     FROM districts
     WHERE status = 'active'
     ORDER BY district_name ASC`
  );
  return rows;
};

export const getDistrictById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, official_district_code, district_name, region, state, status, created_at, updated_at
     FROM districts WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getDistrictByCode = async (officialCode) => {
  const [rows] = await pool.execute(
    'SELECT * FROM districts WHERE official_district_code = ? LIMIT 1',
    [officialCode]
  );
  return rows[0] || null;
};

export const countDistricts = async () => {
  const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM districts WHERE status = "active"');
  return row.total;
};

// ═══════════════════════════════════════════════════════════════
//  TALUKAS
// ═══════════════════════════════════════════════════════════════

export const upsertTaluka = async ({ officialCode, districtId, name }) => {
  await pool.execute(
    `INSERT INTO talukas (official_taluka_code, district_id, taluka_name, status)
     VALUES (?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE
       taluka_name = VALUES(taluka_name),
       district_id = VALUES(district_id),
       status      = 'active',
       updated_at  = NOW()`,
    [officialCode, districtId, name]
  );
  return getTalukaByCode(officialCode);
};

export const getTalukasByDistrictId = async (districtId) => {
  const [rows] = await pool.execute(
    `SELECT id, official_taluka_code, district_id, taluka_name, status, created_at, updated_at
     FROM talukas
     WHERE district_id = ? AND status = 'active'
     ORDER BY taluka_name ASC`,
    [districtId]
  );
  return rows;
};

export const getTalukaById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT t.id, t.official_taluka_code, t.district_id, t.taluka_name, t.status,
            d.district_name, d.official_district_code
     FROM talukas t
     JOIN districts d ON d.id = t.district_id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getTalukaByCode = async (officialCode) => {
  const [rows] = await pool.execute(
    'SELECT * FROM talukas WHERE official_taluka_code = ? LIMIT 1',
    [officialCode]
  );
  return rows[0] || null;
};

export const countTalukas = async () => {
  const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM talukas WHERE status = "active"');
  return row.total;
};

// ═══════════════════════════════════════════════════════════════
//  VILLAGES
// ═══════════════════════════════════════════════════════════════

export const upsertVillage = async ({ officialCode, talukaId, name, localName }) => {
  await pool.execute(
    `INSERT INTO villages (official_village_code, taluka_id, village_name, village_local_name, status)
     VALUES (?, ?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE
       village_name       = VALUES(village_name),
       village_local_name = VALUES(village_local_name),
       taluka_id          = VALUES(taluka_id),
       status             = 'active',
       updated_at         = NOW()`,
    [officialCode, talukaId, name, localName || null]
  );
  return getVillageByCode(officialCode);
};

export const getVillagesByTalukaId = async (talukaId) => {
  const [rows] = await pool.execute(
    `SELECT id, official_village_code, taluka_id, village_name, village_local_name, status, created_at, updated_at
     FROM villages
     WHERE taluka_id = ? AND status = 'active'
     ORDER BY village_name ASC`,
    [talukaId]
  );
  return rows;
};

export const getVillageById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.official_village_code, v.taluka_id, v.village_name, v.village_local_name, v.status,
            t.taluka_name, t.official_taluka_code,
            d.id AS district_id, d.district_name, d.official_district_code
     FROM villages v
     JOIN talukas t  ON t.id = v.taluka_id
     JOIN districts d ON d.id = t.district_id
     WHERE v.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const getVillageByCode = async (officialCode) => {
  const [rows] = await pool.execute(
    'SELECT * FROM villages WHERE official_village_code = ? LIMIT 1',
    [officialCode]
  );
  return rows[0] || null;
};

export const getVillagesFiltered = async ({ districtId, talukaId, search }) => {
  let sql = `
    SELECT v.id, v.official_village_code, v.taluka_id, v.village_name, v.village_local_name, v.status,
           t.taluka_name, d.id AS district_id, d.district_name
    FROM villages v
    JOIN talukas  t ON t.id = v.taluka_id
    JOIN districts d ON d.id = t.district_id
    WHERE v.status = 'active'
  `;
  const params = [];

  if (talukaId) {
    sql += ' AND v.taluka_id = ?';
    params.push(talukaId);
  } else if (districtId) {
    sql += ' AND d.id = ?';
    params.push(districtId);
  }

  if (search) {
    sql += ' AND (v.village_name LIKE ? OR v.village_local_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY v.village_name ASC LIMIT 500';

  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const countVillages = async () => {
  const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM villages WHERE status = "active"');
  return row.total;
};
