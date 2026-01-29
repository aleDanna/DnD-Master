/**
 * Database Migration Runner
 * Runs SQL migration files against the database using psql
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  // Get database config from environment
  const connectionString = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'dnd_master';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';

  const initSqlPath = resolve(__dirname, '../sql/init.sql');
  console.log(`Running migration file: ${initSqlPath}`);

  try {
    // Try using psql first (handles complex SQL files better)
    let psqlCmd: string;

    if (connectionString) {
      psqlCmd = `psql "${connectionString}" -f "${initSqlPath}"`;
    } else {
      // Set PGPASSWORD environment variable for psql
      process.env.PGPASSWORD = dbPassword;
      psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${initSqlPath}"`;
    }

    console.log('Running migrations with psql...');
    execSync(psqlCmd, { stdio: 'inherit' });
    console.log('\nMigrations completed successfully!');

  } catch (psqlError) {
    console.log('psql not available, falling back to pg library...');

    // Fallback: Use pg library with statement splitting
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
      await pool.query('SELECT 1');
      console.log('Connected to database successfully');

      const { readFileSync } = await import('fs');
      const initSql = readFileSync(initSqlPath, 'utf-8');

      // Split SQL into statements, respecting dollar-quoted strings
      const statements = splitSqlStatements(initSql);

      console.log(`Executing ${statements.length} statements...`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt || stmt.startsWith('--')) continue;

        try {
          await pool.query(stmt);
          process.stdout.write('.');
        } catch (err: any) {
          // Ignore "already exists" errors for idempotent migrations
          if (err.code === '42710' || err.code === '42P07') {
            process.stdout.write('s'); // skip
          } else {
            console.error(`\nError in statement ${i + 1}:`, err.message);
            console.error('Statement:', stmt.slice(0, 200) + '...');
            throw err;
          }
        }
      }

      console.log('\nMigrations completed successfully!');

    } finally {
      await pool.end();
    }
  }

  // Verify tables exist
  const verifyConfig = connectionString
    ? { connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
        host: dbHost,
        port: parseInt(dbPort, 10),
        database: dbName,
        user: dbUser,
        password: dbPassword,
      };

  const verifyPool = new Pool(verifyConfig);

  try {
    const result = await verifyPool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('source_documents', 'rule_chapters', 'rule_sections', 'rule_entries', 'rule_categories')
      ORDER BY table_name
    `);

    console.log('\nVerified tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    if (result.rows.length < 5) {
      console.warn('\nWarning: Not all expected tables were created');
    }
  } finally {
    await verifyPool.end();
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
    const char = sql[i];

    // Check for dollar quote start/end
    if (char === '$') {
      // Look for dollar quote tag
      let j = i + 1;
      while (j < sql.length && (sql[j].match(/[a-zA-Z0-9_]/) || sql[j] === '$')) {
        if (sql[j] === '$') {
          const tag = sql.slice(i, j + 1);
          if (inDollarQuote && tag === dollarTag) {
            // End of dollar quote
            current += tag;
            i = j + 1;
            inDollarQuote = false;
            dollarTag = '';
            continue;
          } else if (!inDollarQuote) {
            // Start of dollar quote
            inDollarQuote = true;
            dollarTag = tag;
            current += tag;
            i = j + 1;
            continue;
          }
          break;
        }
        j++;
      }
    }

    // Check for statement end (semicolon outside dollar quotes)
    if (char === ';' && !inDollarQuote) {
      current += char;
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Add any remaining content
  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }

  return statements;
}

runMigrations();
