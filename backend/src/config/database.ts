/**
 * PostgreSQL Database Configuration
 * Direct connection to PostgreSQL using the pg library
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Database pool singleton
let pool: Pool | null = null;

/**
 * Database configuration from environment variables
 */
interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Get database configuration from environment
 */
function getConfig(): DatabaseConfig {
  // Prefer DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
      max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  // Fall back to individual connection parameters
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'dnd_master',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
    max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

/**
 * Initialize the database connection pool
 */
export function initializeDatabase(): Pool {
  if (pool) {
    return pool;
  }

  const config = getConfig();
  pool = new Pool(config);

  // Log connection events
  pool.on('connect', () => {
    console.log('📦 Database client connected');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err);
  });

  return pool;
}

/**
 * Get the database pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    return initializeDatabase();
  }
  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = getPool();
  const start = Date.now();

  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    // Log slow queries (over 100ms)
    if (duration > 100) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.slice(0, 100));
    }

    return result;
  } catch (error) {
    console.error('Database query error:', { text: text.slice(0, 200), error });
    throw error;
  }
}

/**
 * Get a client from the pool for transaction support
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('📦 Database pool closed');
  }
}

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0]?.health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Query builder helpers for common operations
 */
export const db = {
  query,
  getClient,
  transaction,

  /**
   * Insert a row and return the inserted data
   */
  async insert<T>(
    table: string,
    data: Record<string, any>,
    returning: string = '*'
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returning}
    `;

    const result = await query<T>(sql, values);
    return result.rows[0] || null;
  },

  /**
   * Find one row by conditions
   */
  async findOne<T>(
    table: string,
    conditions: Record<string, any>,
    columns: string = '*'
  ): Promise<T | null> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');

    const sql = `SELECT ${columns} FROM ${table} WHERE ${where} LIMIT 1`;
    const result = await query<T>(sql, values);
    return result.rows[0] || null;
  },

  /**
   * Find multiple rows by conditions
   */
  async findMany<T>(
    table: string,
    conditions: Record<string, any> = {},
    options: {
      columns?: string;
      orderBy?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T[]> {
    const { columns = '*', orderBy, limit, offset } = options;
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);

    let sql = `SELECT ${columns} FROM ${table}`;

    if (keys.length > 0) {
      const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
      sql += ` WHERE ${where}`;
    }

    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    if (limit) sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;

    const result = await query<T>(sql, values);
    return result.rows;
  },

  /**
   * Update rows and return updated data
   */
  async update<T>(
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>,
    returning: string = '*'
  ): Promise<T | null> {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const condKeys = Object.keys(conditions);
    const condValues = Object.values(conditions);

    const setClause = dataKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const whereClause = condKeys.map((k, i) => `${k} = $${dataKeys.length + i + 1}`).join(' AND ');

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING ${returning}
    `;

    const result = await query<T>(sql, [...dataValues, ...condValues]);
    return result.rows[0] || null;
  },

  /**
   * Delete rows
   */
  async delete(
    table: string,
    conditions: Record<string, any>
  ): Promise<number> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');

    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await query(sql, values);
    return result.rowCount || 0;
  },
};

export default db;
