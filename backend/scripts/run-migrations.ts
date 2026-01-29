/**
 * Database Migration Runner
 * Runs SQL migration files against the database
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  // Get database config from environment
  const connectionString = process.env.DATABASE_URL;

  const config = connectionString
    ? { connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'dnd_master',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      };

  console.log('Connecting to database...');
  const pool = new Pool(config);

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('Connected to database successfully');

    // Read and run init.sql
    const initSqlPath = resolve(__dirname, '../sql/init.sql');
    console.log(`Reading migration file: ${initSqlPath}`);

    const initSql = readFileSync(initSqlPath, 'utf-8');

    console.log('Running migrations...');
    await pool.query(initSql);

    console.log('Migrations completed successfully!');

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('source_documents', 'rule_chapters', 'rule_sections', 'rule_entries', 'rule_categories')
      ORDER BY table_name
    `);

    console.log('\nCreated tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
