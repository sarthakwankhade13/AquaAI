import bcrypt from 'bcrypt';
import { pool } from '../src/config/db.js';

const createDefaultAccounts = async () => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        console.log('Creating AquaAI Taluka Admin accounts...\n');

        // ============================================================
        // ROLE
        // ============================================================

        const TALUKA_ADMIN_ROLE = 3;

        // ============================================================
        // HELPER
        // Converts Taluka names into safe email usernames
        //
        // Example:
        // "Amravati"     -> "amravati"
        // "Murtizapur"   -> "murtizapur"
        // "Barshitakli"  -> "barshitakli"
        // ============================================================

        const normalizeName = (name) => {
            return name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '');
        };

        // ============================================================
        // ACTIVE TALUKAS
        // ============================================================

        const [talukas] = await connection.execute(`
            SELECT
                t.id,
                t.official_taluka_code,
                t.taluka_name,

                t.district_id,

                d.official_district_code,
                d.district_name

            FROM talukas t

            INNER JOIN districts d
                ON t.district_id = d.id

            WHERE t.status = 'active'
              AND d.status = 'active'

            ORDER BY t.id
        `);

        console.log(
            `Found ${talukas.length} active talukas.\n`
        );

        // ============================================================
        // CHECK DUPLICATE TALUKA NAMES
        // ============================================================

        const talukaNameCounts = {};

        for (const taluka of talukas) {

            const username =
                normalizeName(taluka.taluka_name);

            talukaNameCounts[username] =
                (talukaNameCounts[username] || 0) + 1;
        }

        // ============================================================
        // CREATE TALUKA ADMINS
        // ============================================================

        for (const taluka of talukas) {

            const talukaName =
                taluka.taluka_name.trim();

            const districtName =
                taluka.district_name.trim();

            const username =
                normalizeName(talukaName);

            // ========================================================
            // EMAIL
            // ========================================================

            let email;

            if (talukaNameCounts[username] === 1) {

                // Example:
                // Amravati
                // amravati@taluka.in

                email =
                    `${username}@taluka.in`;

            } else {

                // If same Taluka name exists in multiple districts,
                // append official Taluka code to keep email unique.

                email =
                    `${username}-${taluka.official_taluka_code}@taluka.in`;
            }

            // ========================================================
            // PASSWORD
            // ========================================================

            const password =
                'taluka123';

            const hashedPassword =
                await bcrypt.hash(password, 10);

            // ========================================================
            // UNIQUE MOBILE
            // ========================================================

            const mobile =
                `920000${String(taluka.id).padStart(4, '0')}`;

            // ========================================================
            // USER DETAILS
            // ========================================================

            const fullName =
                `${talukaName} Taluka Admin`;

            const address =
                `${talukaName}, ${districtName}, Maharashtra`;

            // ========================================================
            // INSERT USER
            // ========================================================

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
                    ?, ?, ?, ?,
                    ?, ?,
                    1, 1,
                    NOW(), NOW()
                )
                `,
                [
                    TALUKA_ADMIN_ROLE,

                    'MH',
                    'Maharashtra',

                    taluka.official_district_code,
                    districtName,

                    taluka.official_taluka_code,
                    talukaName,

                    fullName,
                    email,
                    mobile,
                    hashedPassword,

                    'Other',
                    address
                ]
            );

            console.log(
                `✓ TALUKA_ADMIN | ${email} | ${password}`
            );
        }

        // ============================================================
        // COMMIT
        // ============================================================

        await connection.commit();

        console.log('\n======================================');
        console.log('TALUKA ADMIN ACCOUNTS CREATED');
        console.log('======================================');

        console.log(
            `Taluka Admins : ${talukas.length}`
        );

        console.log(
            `Password      : taluka123`
        );

    } catch (error) {

        await connection.rollback();

        console.error('\n❌ Taluka account creation failed.');
        console.error(error);

    } finally {

        connection.release();
        await pool.end();
    }
};

createDefaultAccounts();