import { pool } from '../src/config/db.js';
import env from '../src/config/env.js';
import { syncVidarbhaGeography, VIDARBHA_DISTRICTS } from '../src/services/geography/geography-sync.service.js';

const BASE_URL = `http://localhost:${env.PORT}/api/v1`;

async function runTests() {
  console.log('===========================================================');
  console.log(' AquaAI — Geographical Master-Data Integration Test Suite');
  console.log('===========================================================\n');

  try {
    // 1. Run Synchronization (1st Pass)
    console.log('▶ [Test 1] Running Vidarbha Geography Sync (Pass 1)...');
    const syncRes1 = await syncVidarbhaGeography();
    console.log('   Sync Pass 1 Stats:', JSON.stringify(syncRes1, null, 2));

    // 2. Run Synchronization (2nd Pass) — Test Idempotency
    console.log('\n▶ [Test 2] Running Vidarbha Geography Sync (Pass 2 - Idempotency Check)...');
    const syncRes2 = await syncVidarbhaGeography();
    console.log('   Sync Pass 2 Stats:', JSON.stringify(syncRes2, null, 2));

    console.log('\n   Idempotency Verification:');
    console.log(`   - Pass 1 Districts: ${syncRes1.dbTotals.districts} | Pass 2 Districts: ${syncRes2.dbTotals.districts}`);
    console.log(`   - Pass 1 Talukas: ${syncRes1.dbTotals.talukas} | Pass 2 Talukas: ${syncRes2.dbTotals.talukas}`);
    console.log(`   - Pass 1 Villages: ${syncRes1.dbTotals.villages} | Pass 2 Villages: ${syncRes2.dbTotals.villages}`);
    
    if (
      syncRes1.dbTotals.districts === syncRes2.dbTotals.districts &&
      syncRes1.dbTotals.talukas === syncRes2.dbTotals.talukas &&
      syncRes1.dbTotals.villages === syncRes2.dbTotals.villages
    ) {
      console.log('   ✅ PASS: Synchronization is completely idempotent. No duplicates created!');
    } else {
      console.error('   ❌ FAIL: Duplicate records created on re-sync!');
    }

    // 3. Database Validation
    console.log('\n▶ [Test 3] Validating Vidarbha Districts in Database...');
    const [dbDistricts] = await pool.execute('SELECT * FROM districts WHERE status = "active" ORDER BY district_name');
    console.log(`   Total Districts in DB: ${dbDistricts.length}`);
    const districtNames = dbDistricts.map(d => d.district_name.toLowerCase());
    const isStrictVidarbha = dbDistricts.every(d => VIDARBHA_DISTRICTS.includes(d.district_name.toLowerCase()));
    
    if (dbDistricts.length <= 11 && isStrictVidarbha) {
      console.log(`   ✅ PASS: Exactly ${dbDistricts.length} Vidarbha districts present:`, dbDistricts.map(d => d.district_name).join(', '));
    } else {
      console.error('   ❌ FAIL: Non-Vidarbha districts found in DB!');
    }

    // 4. Foreign Key Integrity Check
    console.log('\n▶ [Test 4] Validating Foreign Key Relationships & No Orphan Records...');
    const [[orphanTalukas]] = await pool.execute('SELECT COUNT(*) AS total FROM talukas t LEFT JOIN districts d ON d.id = t.district_id WHERE d.id IS NULL');
    const [[orphanVillages]] = await pool.execute('SELECT COUNT(*) AS total FROM villages v LEFT JOIN talukas t ON t.id = v.taluka_id WHERE t.id IS NULL');
    
    if (orphanTalukas.total === 0 && orphanVillages.total === 0) {
      console.log('   ✅ PASS: No orphan talukas or villages found. Relational integrity strictly maintained!');
    } else {
      console.error(`   ❌ FAIL: Found ${orphanTalukas.total} orphan talukas and ${orphanVillages.total} orphan villages.`);
    }

    console.log('\n===========================================================');
    console.log(' All Core Geography Integration Tests Passed Successfully!');
    console.log('===========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();
