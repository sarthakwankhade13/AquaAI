import bcrypt from 'bcrypt';
import { pool } from '../src/config/db.js';

const createDefaultAccounts = async () => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        console.log('Creating default AquaAI accounts...\n');

        // ============================================================
        // ROLE IDs
        // ============================================================

        const DISTRICT_ADMIN_ROLE = 2;
        const VILLAGE_OFFICER_ROLE = 3;

        // ============================================================
        // HELPER
        // Converts names into safe email usernames
        //
        // Example:
        // "Akola"       -> "akola"
        // "Wahalabk."   -> "wahalabk"
        // "Adgaon Kh."  -> "adgaonkh"
        // ============================================================

        const normalizeName = (name) => {
            return name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '');
        };

        // ============================================================
        // DISTRICT ADMINS
        // ============================================================

        const [districts] = await connection.execute(`
            SELECT
                id,
                official_district_code,
                district_name
            FROM districts
            WHERE status = 'active'
            ORDER BY id
        `);

        console.log(`Found ${districts.length} active districts.\n`);

        for (const district of districts) {

            const districtName = district.district_name.trim();

            // Example:
            // Akola -> akola@gov.in
            const username = normalizeName(districtName);

            const email = `${username}@gov.in`;

            // Example:
            // Akola -> akola123
            const password = `${username}123`;

            const hashedPassword = await bcrypt.hash(password, 10);

            // Unique synthetic mobile based on district ID
            const mobile =
                `910000${String(district.id).padStart(4, '0')}`;

            const fullName =
                `${districtName} District Admin`;

            const address =
                `${districtName}, Maharashtra`;

            await connection.execute(
                `
                INSERT INTO users
                (
                    role_id,
                    state_code,
                    state_name,
                    district_code,
                    district_name,
                    full_name,
                    email,
                    mobile,
                    password,
                    gender,
                    address,
                    is_verified,
                    is_active,
                    created_at,
                    updated_at
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
                `,
                [
                    DISTRICT_ADMIN_ROLE,
                    'MH',
                    'Maharashtra',

                    district.official_district_code,
                    districtName,

                    fullName,
                    email,
                    mobile,
                    hashedPassword,

                    'Other',
                    address
                ]
            );

            console.log(
                `✓ DISTRICT_ADMIN | ${email} | ${password}`
            );
        }

        // ============================================================
        // VILLAGE OFFICERS
        // ============================================================

        const [villages] = await connection.execute(`
            SELECT
                v.id,
                v.official_village_code,
                v.village_name,

                v.taluka_id,

                t.official_taluka_code,
                t.taluka_name,

                t.district_id,

                d.official_district_code,
                d.district_name

            FROM villages v

            INNER JOIN talukas t
                ON v.taluka_id = t.id

            INNER JOIN districts d
                ON t.district_id = d.id

            WHERE v.status = 'active'
              AND t.status = 'active'
              AND d.status = 'active'

            ORDER BY v.id
        `);

        console.log(`\nFound ${villages.length} active villages.`);

        // ============================================================
        // FIND DUPLICATE VILLAGE NAMES
        // ============================================================

        const villageNameCounts = {};

        for (const village of villages) {

            const username =
                normalizeName(village.village_name);

            villageNameCounts[username] =
                (villageNameCounts[username] || 0) + 1;
        }

        // ============================================================
        // CREATE VILLAGE OFFICERS
        // ============================================================

        for (const village of villages) {

            const villageName =
                village.village_name.trim();

            const districtName =
                village.district_name.trim();

            const talukaName =
                village.taluka_name.trim();

            const username =
                normalizeName(villageName);

            let email;

            // --------------------------------------------------------
            // UNIQUE VILLAGE NAME
            //
            // Dagadkhed
            // -> dagadkhed@gov.in
            // --------------------------------------------------------

            if (villageNameCounts[username] === 1) {

                email =
                    `${username}@gov.in`;

            } else {

                // ----------------------------------------------------
                // DUPLICATE VILLAGE NAME
                //
                // Chandanpur + official code
                // -> chandanpur-529xxx@gov.in
                //
                // This guarantees unique email addresses.
                // ----------------------------------------------------

                email =
                    `${username}-${village.official_village_code}@gov.in`;
            }

            // Same password for every Village Officer
            const password = 'village123';

            const hashedPassword =
                await bcrypt.hash(password, 10);

            // Unique synthetic mobile based on village ID
            const mobile =
                `920000${String(village.id).padStart(4, '0')}`;

            const fullName =
                `${villageName} Village Officer`;

            const address =
                `${villageName}, ${talukaName}, ${districtName}, Maharashtra`;

            await connection.execute(
                `
                INSERT INTO users
                (
                    role_id,

                    state_code,
                    state_name,

                    district_code,
                    district_name,

                    taluka_code,
                    taluka_name,

                    village_code,
                    village_name,

                    full_name,
                    email,
                    mobile,
                    password,

                    gender,
                    address,

                    is_verified,
                    is_active,

                    created_at,
                    updated_at
                )
                VALUES
                (
                    ?, ?, ?,
                    ?, ?,
                    ?, ?,
                    ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    1, 1,
                    NOW(), NOW()
                )
                `,
                [
                    VILLAGE_OFFICER_ROLE,

                    'MH',
                    'Maharashtra',

                    village.official_district_code,
                    districtName,

                    village.official_taluka_code,
                    talukaName,

                    village.official_village_code,
                    villageName,

                    fullName,
                    email,
                    mobile,
                    hashedPassword,

                    'Other',
                    address
                ]
            );

            console.log(
                `✓ VILLAGE_OFFICER | ${email} | ${password}`
            );
        }

        // ============================================================
        // COMMIT
        // ============================================================

        await connection.commit();

        console.log('\n======================================');
        console.log('DEFAULT ACCOUNTS CREATED SUCCESSFULLY');
        console.log('======================================');

        console.log(`District Admins : ${districts.length}`);
        console.log(`Village Officers: ${villages.length}`);
        console.log(
            `Total Accounts  : ${districts.length + villages.length}`
        );

    } catch (error) {

        await connection.rollback();

        console.error('\n❌ Account creation failed.');
        console.error(error);

    } finally {

        connection.release();
        await pool.end();
    }
};

createDefaultAccounts();