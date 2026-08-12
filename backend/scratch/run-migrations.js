import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import env from '../src/config/env.js';

async function migrate() {
  console.log('Running geography migration...');
  const connection = await mysql.createConnection({
    host    : env.db.host,
    port    : env.db.port,
    user    : env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: true,
  });

  const sqlPath = path.join(process.cwd(), 'src', 'migrations', '001_geography_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await connection.query(sql);
  console.log('Geography migration completed successfully!');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
