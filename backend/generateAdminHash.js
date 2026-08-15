#!/usr/bin/env node

/**
 * generateAdminHash.js
 * 
 * Utility to generate a bcrypt hash for the WRD Super Admin password.
 * Run this script and use the output to update the admin user's password.
 * 
 * Usage: node generateAdminHash.js <password>
 * Example: node generateAdminHash.js "MySecurePassword123"
 */

import bcryptjs from 'bcryptjs';

const password = process.argv[2] || 'AquaAI@2024';

(async () => {
  try {
    const hash = await bcryptjs.hash(password, 12);
    console.log('\n✓ Bcrypt Hash Generated Successfully\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this hash in the 000_auth_tables.sql migration file or to update the admin user.\n');
    console.log('SQL Command to update admin user:');
    console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@wrd.gov.in';\n`);
  } catch (err) {
    console.error('Error generating hash:', err.message);
    process.exit(1);
  }
})();
