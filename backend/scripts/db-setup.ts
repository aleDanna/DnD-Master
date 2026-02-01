/**
 * Database Setup Script
 * Initializes and seeds the database using SQL files
 */

import { readFileSync } from 'fs';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'dnd_master',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
};

async function runSqlFile(pool: Pool, filePath: string, description: string): Promise<void> {
  console.log(`\n📄 Running ${description}...`);
  console.log(`   File: ${filePath}`);

  try {
    const sql = readFileSync(filePath, 'utf-8');
    await pool.query(sql);
    console.log(`   ✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`   ❌ Error running ${description}:`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  console.log('🎲 DnD Master Database Setup');
  console.log('============================');
  console.log(`Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
  console.log(`Command: ${command}`);

  const pool = new Pool(dbConfig);

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    const dbDir = join(__dirname, '..', 'db');

    switch (command) {
      case 'init':
        // Create schema only (tables, indexes, triggers, views)
        await runSqlFile(pool, join(dbDir, 'init.sql'), 'Database schema initialization');
        break;

      case 'seed':
        // Populate D&D content data
        await runSqlFile(pool, join(dbDir, 'content.sql'), 'D&D content seeding');
        break;

      case 'setup':
        // Full setup: schema + content
        await runSqlFile(pool, join(dbDir, 'init.sql'), 'Database schema initialization');
        await runSqlFile(pool, join(dbDir, 'content.sql'), 'D&D content seeding');
        break;

      case 'reset':
        // Reset: drop and recreate everything
        console.log('\n⚠️  This will DROP and recreate all tables!');
        await runSqlFile(pool, join(dbDir, 'init.sql'), 'Database reset (schema)');
        await runSqlFile(pool, join(dbDir, 'content.sql'), 'D&D content seeding');
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: init, seed, setup, reset');
        process.exit(1);
    }

    console.log('\n🎉 Database setup complete!');
  } catch (error) {
    console.error('\n💥 Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
