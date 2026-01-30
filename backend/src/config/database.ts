/**
 * PostgreSQL Database Configuration
 * Direct PostgreSQL connection using pg (node-postgres)
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { createMockDatabase, isMockMode, MockDatabase } from './mockDatabase.js';

// Database configuration from environment
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'dnd_master',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  max: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Check if we're in mock mode
const mockMode = isMockMode();

if (mockMode) {
  console.warn('[Database] Running in MOCK MODE - no PostgreSQL credentials found');
  console.warn('[Database] Data will be stored in memory and lost on restart');
  console.warn('[Database] Set DATABASE_HOST, DATABASE_NAME, DATABASE_USER, and DATABASE_PASSWORD for real PostgreSQL');
}

// Create the pool (or null if in mock mode)
let pool: Pool | null = null;

if (!mockMode) {
  pool = new Pool(config);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

// Mock database instance
const mockDb: MockDatabase | null = mockMode ? createMockDatabase() : null;

/**
 * Database client interface that abstracts pg Pool and mock database
 */
export interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  getClient(): Promise<PoolClient | MockPoolClient>;
}

export interface MockPoolClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  release(): void;
}

/**
 * Get a database client for executing queries
 */
export function getDbClient(): DbClient {
  if (mockMode && mockDb) {
    return {
      query: <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
        return mockDb.query(text, params);
      },
      getClient: async (): Promise<MockPoolClient> => {
        return {
          query: <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
            return mockDb.query(text, params);
          },
          release: () => {
            // No-op for mock
          },
        };
      },
    };
  }

  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  return {
    query: <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
      return pool!.query(text, params);
    },
    getClient: async (): Promise<PoolClient> => {
      return pool!.connect();
    },
  };
}

/**
 * Get the raw pool (for advanced operations)
 * Returns null in mock mode
 */
export function getPool(): Pool | null {
  return pool;
}

/**
 * Execute a query directly
 */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const client = getDbClient();
  return client.query(text, params);
}

/**
 * Execute a transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient | MockPoolClient) => Promise<T>
): Promise<T> {
  const dbClient = getDbClient();
  const client = await dbClient.getClient();

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
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<boolean> {
  if (mockMode) {
    return true;
  }

  try {
    const result = await query('SELECT 1');
    return result.rowCount === 1;
  } catch {
    return false;
  }
}

export { mockMode as isMockMode };
