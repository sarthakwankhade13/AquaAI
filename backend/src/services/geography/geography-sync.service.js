/**
 * geography-sync.service.js
 * Master-data synchronization service for Vidarbha geography.
 *
 * Fetches official Maharashtra Government APIs, filters strictly for 11 Vidarbha
 * districts, and performs idempotent upserts into the MySQL database.
 */

import { fetchAllDistricts, fetchTalukasByDistrict, fetchVillagesByTaluka } from './maharashtra.api.js';
import * as geoRepo from '../../repositories/geography.repository.js';
import logger from '../../utils/logger.js';

// AquaAI V1 supports strictly these 11 Vidarbha districts
export const VIDARBHA_DISTRICTS = [
  'nagpur',
  'wardha',
  'bhandara',
  'gondia',
  'chandrapur',
  'gadchiroli',
  'amravati',
  'akola',
  'buldhana',
  'washim',
  'yavatmal',
];

/**
 * Synchronize Vidarbha geographical data from official Maharashtra APIs into MySQL.
 * Idempotent execution using database UPSERT (INSERT ON DUPLICATE KEY UPDATE).
 */
export const syncVidarbhaGeography = async () => {
  logger.info('[GEOGRAPHY_SYNC] Starting Vidarbha geography synchronization...');

  const stats = {
    districtsProcessed: 0,
    talukasProcessed  : 0,
    villagesProcessed : 0,
    inserted          : 0,
    updated           : 0,
    failed            : 0,
    errors            : [],
  };

  let fetchedDistricts = [];
  try {
    fetchedDistricts = await fetchAllDistricts();
  } catch (err) {
    logger.error(`[GEOGRAPHY_SYNC] Failed to fetch districts list: ${err.message}`);
    throw new Error(`Failed to fetch official districts: ${err.message}`);
  }

  // Filter for Vidarbha districts only
  const vidarbhaDistricts = fetchedDistricts.filter((d) => {
    const norm = (d.name || '').trim().toLowerCase();
    return VIDARBHA_DISTRICTS.includes(norm);
  });

  logger.info(`[GEOGRAPHY_SYNC] Found ${vidarbhaDistricts.length} Vidarbha districts out of ${fetchedDistricts.length} total districts.`);

  for (const rawDistrict of vidarbhaDistricts) {
    let dbDistrict;
    try {
      const existingDist = await geoRepo.getDistrictByCode(rawDistrict.code);
      dbDistrict = await geoRepo.upsertDistrict({
        officialCode: rawDistrict.code,
        name        : rawDistrict.name,
        region      : 'Vidarbha',
        state       : 'Maharashtra',
      });

      stats.districtsProcessed++;
      if (existingDist) {
        stats.updated++;
      } else {
        stats.inserted++;
      }
    } catch (err) {
      stats.failed++;
      const errMsg = `District: ${rawDistrict.name} | Error: ${err.message}`;
      logger.error(`[GEOGRAPHY_SYNC] ${errMsg}`);
      stats.errors.push(errMsg);
      continue; // Continue with remaining districts
    }

    // Fetch Talukas for this district
    let fetchedTalukas = [];
    try {
      fetchedTalukas = await fetchTalukasByDistrict(dbDistrict.official_district_code);
    } catch (err) {
      stats.failed++;
      const errMsg = `District: ${dbDistrict.district_name} | Taluka Fetch Error: ${err.message}`;
      logger.error(`[GEOGRAPHY_SYNC] ${errMsg}`);
      stats.errors.push(errMsg);
      continue;
    }

    for (const rawTaluka of fetchedTalukas) {
      let dbTaluka;
      try {
        const existingTaluka = await geoRepo.getTalukaByCode(rawTaluka.code);
        dbTaluka = await geoRepo.upsertTaluka({
          officialCode: rawTaluka.code,
          districtId  : dbDistrict.id,
          name        : rawTaluka.name,
        });

        stats.talukasProcessed++;
        if (existingTaluka) {
          stats.updated++;
        } else {
          stats.inserted++;
        }
      } catch (err) {
        stats.failed++;
        const errMsg = `District: ${dbDistrict.district_name} | Taluka: ${rawTaluka.name} | Error: ${err.message}`;
        logger.error(`[GEOGRAPHY_SYNC] ${errMsg}`);
        stats.errors.push(errMsg);
        continue;
      }

      // Fetch Villages for this taluka
      let fetchedVillages = [];
      try {
        fetchedVillages = await fetchVillagesByTaluka(dbDistrict.official_district_code, dbTaluka.official_taluka_code);
      } catch (err) {
        stats.failed++;
        const errMsg = `District: ${dbDistrict.district_name} | Taluka: ${dbTaluka.taluka_name} | Village Fetch Error: ${err.message}`;
        logger.error(`[GEOGRAPHY_SYNC] ${errMsg}`);
        stats.errors.push(errMsg);
        continue;
      }

      for (const rawVillage of fetchedVillages) {
        try {
          const existingVillage = await geoRepo.getVillageByCode(rawVillage.code);
          await geoRepo.upsertVillage({
            officialCode: rawVillage.code,
            talukaId    : dbTaluka.id,
            name        : rawVillage.name,
            localName   : rawVillage.localName,
          });

          stats.villagesProcessed++;
          if (existingVillage) {
            stats.updated++;
          } else {
            stats.inserted++;
          }
        } catch (err) {
          stats.failed++;
          const errMsg = `Taluka: ${dbTaluka.taluka_name} | Village: ${rawVillage.name} | Error: ${err.message}`;
          logger.error(`[GEOGRAPHY_SYNC] ${errMsg}`);
          stats.errors.push(errMsg);
        }
      }
    }
  }

  // Final database counts validation
  const districtCount = await geoRepo.countDistricts();
  const talukaCount = await geoRepo.countTalukas();
  const villageCount = await geoRepo.countVillages();

  logger.info(`[GEOGRAPHY_SYNC] Sync complete. DB Totals -> Districts: ${districtCount}, Talukas: ${talukaCount}, Villages: ${villageCount}`);

  return {
    districtsProcessed: stats.districtsProcessed,
    talukasProcessed  : stats.talukasProcessed,
    villagesProcessed : stats.villagesProcessed,
    inserted          : stats.inserted,
    updated           : stats.updated,
    failed            : stats.failed,
    errors            : stats.errors,
    dbTotals          : {
      districts: districtCount,
      talukas  : talukaCount,
      villages : villageCount,
    },
  };
};
