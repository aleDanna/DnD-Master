/**
 * Database Migration Runner
 * Runs all SQL migration and seed files against the database
 *
 * Order:
 * 1. init.sql - Core app schema (users, campaigns, sessions, rule_entries)
 * 2. content.sql - D&D content schema (abilities, skills, spells, monsters, etc.)
 * 3. seed-dnd-content.sql - D&D reference data
 * 4. seed-rules.sql - Sample rules for Rules Explorer
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { Pool } from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQL files to run in order
const SQL_FILES = [
  { name: 'init.sql', description: 'Core app schema' },
  { name: 'content.sql', description: 'D&D content schema' },
  { name: 'seed-dnd-content.sql', description: 'D&D reference data' },
  { name: 'seed-rules.sql', description: 'Sample rules data' },
];

async function runMigrations() {
  console.log('🎲 DnD-Master Database Migration\n');
  console.log('='.repeat(50));

  // Get database config from environment
  const connectionString = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'dnd_master';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';

  // Check which files exist
  const filesToRun = SQL_FILES.filter(file => {
    const path = resolve(__dirname, '../sql', file.name);
    const exists = existsSync(path);
    if (!exists) {
      console.log(`⚠️  Skipping ${file.name} (file not found)`);
    }
    return exists;
  });

  if (filesToRun.length === 0) {
    console.error('❌ No SQL files found to run');
    process.exit(1);
  }

  console.log(`\nFiles to run (${filesToRun.length}):`);
  filesToRun.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file.name} - ${file.description}`);
  });
  console.log('');

  // Try psql first, fall back to pg library
  const usePsql = await tryPsql(connectionString, dbHost, dbPort, dbName, dbUser, dbPassword, filesToRun);

  if (!usePsql) {
    await runWithPgLibrary(connectionString, dbHost, dbPort, dbName, dbUser, dbPassword, filesToRun);
  }

  // Verify tables
  await verifyTables(connectionString, dbHost, dbPort, dbName, dbUser, dbPassword);

  console.log('\n' + '='.repeat(50));
  console.log('✅ All migrations completed successfully!');
  console.log('='.repeat(50) + '\n');
}

async function tryPsql(
  connectionString: string | undefined,
  dbHost: string,
  dbPort: string,
  dbName: string,
  dbUser: string,
  dbPassword: string,
  files: typeof SQL_FILES
): Promise<boolean> {
  try {
    // Test if psql is available
    execSync('which psql', { stdio: 'pipe' });

    console.log('Using psql for migrations...\n');

    if (!connectionString) {
      process.env.PGPASSWORD = dbPassword;
    }

    for (const file of files) {
      const filePath = resolve(__dirname, '../sql', file.name);
      console.log(`📄 Running ${file.name}...`);

      let psqlCmd: string;
      if (connectionString) {
        psqlCmd = `psql "${connectionString}" -f "${filePath}"`;
      } else {
        psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filePath}"`;
      }

      try {
        execSync(psqlCmd, { stdio: 'inherit' });
        console.log(`   ✓ ${file.description} completed\n`);
      } catch (err) {
        console.error(`   ✗ Error running ${file.name}`);
        throw err;
      }
    }

    return true;
  } catch (err: any) {
    if (err.message?.includes('which psql')) {
      console.log('psql not available, using pg library...\n');
      return false;
    }
    throw err;
  }
}

async function runWithPgLibrary(
  connectionString: string | undefined,
  dbHost: string,
  dbPort: string,
  dbName: string,
  dbUser: string,
  dbPassword: string,
  files: typeof SQL_FILES
): Promise<void> {
  const config = connectionString
    ? {
        connectionString,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        statement_timeout: 60000, // 60 second timeout per statement
      }
    : {
        host: dbHost,
        port: parseInt(dbPort, 10),
        database: dbName,
        user: dbUser,
        password: dbPassword,
        statement_timeout: 60000,
      };

  const pool = new Pool(config);

  try {
    await pool.query('SELECT 1');
    console.log('📦 Connected to database\n');

    for (const file of files) {
      const filePath = resolve(__dirname, '../sql', file.name);
      console.log(`📄 Running ${file.name}...`);

      console.log(`   Reading file...`);
      const sql = readFileSync(filePath, 'utf-8');
      console.log(`   File loaded (${(sql.length / 1024).toFixed(1)} KB)`);

      console.log(`   Parsing statements...`);
      const statements = splitSqlStatements(sql);
      console.log(`   ${statements.length} statements found\n`);

      // Debug: show first few chars of each statement
      if (process.env.DEBUG_SQL) {
        statements.forEach((s, idx) => {
          console.log(`   [${idx + 1}] ${s.slice(0, 70).replace(/\n/g, ' ')}...`);
        });
        console.log('');
      }

      let executed = 0;
      let skipped = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt || stmt.startsWith('--')) continue;

        // Show progress for every statement (verbose mode for debugging)
        const stmtPreview = stmt.slice(0, 60).replace(/\n/g, ' ').trim();
        console.log(`   [${i + 1}/${statements.length}] ${stmtPreview}...`);

        try {
          await pool.query(stmt);
          executed++;
          console.log(`   ✓ done`);
        } catch (err: any) {
          // Ignore "already exists" errors for idempotent migrations
          if (err.code === '42710' || err.code === '42P07' || err.code === '23505') {
            skipped++;
            console.log(`   ⊘ skipped (already exists)`);
          } else {
            console.error(`   ✗ Error:`, err.message);
            console.error('   Statement:', stmt.slice(0, 200).replace(/\n/g, ' '));
            throw err;
          }
        }
      }

      console.log(`\n   ✓ ${file.description} completed (${executed} executed, ${skipped} skipped)\n`);
    }
  } finally {
    await pool.end();
  }
}

async function verifyTables(
  connectionString: string | undefined,
  dbHost: string,
  dbPort: string,
  dbName: string,
  dbUser: string,
  dbPassword: string
): Promise<void> {
  const config = connectionString
    ? { connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
        host: dbHost,
        port: parseInt(dbPort, 10),
        database: dbName,
        user: dbUser,
        password: dbPassword,
      };

  const pool = new Pool(config);

  try {
    // Check core tables
    const coreResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'campaigns', 'sessions', 'characters', 'events')
      ORDER BY table_name
    `);

    // Check content tables
    const contentResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('abilities', 'skills', 'conditions', 'classes', 'races', 'spells', 'monsters')
      ORDER BY table_name
    `);

    // Check rules tables
    const rulesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('source_documents', 'rule_chapters', 'rule_sections', 'rule_entries')
      ORDER BY table_name
    `);

    console.log('\n📊 Verification:');
    console.log(`   Core tables: ${coreResult.rows.length}/5`);
    console.log(`   Content tables: ${contentResult.rows.length}/7`);
    console.log(`   Rules tables: ${rulesResult.rows.length}/4`);

    // Count some data
    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM abilities) as abilities,
        (SELECT COUNT(*) FROM skills) as skills,
        (SELECT COUNT(*) FROM conditions) as conditions
    `);

    if (counts.rows[0]) {
      const c = counts.rows[0];
      console.log(`\n📈 Seed data:`);
      console.log(`   Abilities: ${c.abilities}`);
      console.log(`   Skills: ${c.skills}`);
      console.log(`   Conditions: ${c.conditions}`);
    }
  } catch (err: any) {
    // Tables might not exist yet, that's okay
    if (err.code !== '42P01') {
      console.warn('   Warning: Could not verify all tables');
    }
  } finally {
    await pool.end();
  }
}

/**
 * Split SQL into statements, respecting dollar-quoted strings and DO blocks
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    // Check for dollar quote start/end
    if (sql[i] === '$') {
      // Look ahead for dollar quote tag (e.g., $$, $tag$)
      const match = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/);
      if (match) {
        const tag = match[0];
        if (inDollarQuote && tag === dollarTag) {
          // End of dollar quote
          current += tag;
          i += tag.length;
          inDollarQuote = false;
          dollarTag = '';
          continue;
        } else if (!inDollarQuote) {
          // Start of dollar quote
          inDollarQuote = true;
          dollarTag = tag;
          current += tag;
          i += tag.length;
          continue;
        }
      }
    }

    // Check for statement end (semicolon outside dollar quotes)
    if (sql[i] === ';' && !inDollarQuote) {
      current += ';';
      // Strip leading comment lines and whitespace
      let trimmed = current.trim();
      while (trimmed.startsWith('--')) {
        const newlineIdx = trimmed.indexOf('\n');
        if (newlineIdx === -1) {
          trimmed = '';
          break;
        }
        trimmed = trimmed.slice(newlineIdx + 1).trim();
      }
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  // Add any remaining content
  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }

  return statements;
}

runMigrations().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
