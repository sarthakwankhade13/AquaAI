/**
 * Quick one-shot database connection test.
 * Run: node test-db.js
 * Safe to delete after verifying connection.
 */
'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const test = async () => {
  console.log('\n🔍 Testing MySQL connection...');
  console.log(`   Host     : ${process.env.DB_HOST}`);
  console.log(`   Port     : ${process.env.DB_PORT}`);
  console.log(`   User     : ${process.env.DB_USER}`);
  console.log(`   Database : ${process.env.DB_NAME}\n`);

  try {
    const connection = await mysql.createConnection({
      host    : process.env.DB_HOST,
      port    : process.env.DB_PORT,
      user    : process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Ping the DB
    await connection.ping();
    console.log('✅  Database connected successfully!\n');

    // Show existing tables
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('⚠️   No tables found in the database yet.');
    } else {
      console.log(`📋  Tables found (${tables.length}):`);
      tables.forEach((t) => console.log(`     - ${Object.values(t)[0]}`));
    }

    await connection.end();
    console.log('\n🔒  Connection closed.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌  Connection FAILED:', err.message);
    console.error('\nFix checklist:');
    console.error('  1. Is MySQL server running?');
    console.error('  2. Is DB_PASSWORD correct in .env?');
    console.error('  3. Does the database DB_NAME exist?');
    console.error('  4. Does the DB_USER have access?\n');
    process.exit(1);
  }
};

test();
