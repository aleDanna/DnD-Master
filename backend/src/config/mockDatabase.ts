/**
 * Mock Database for local development without PostgreSQL
 * Uses in-memory storage for data
 */

import { QueryResult } from 'pg';

// In-memory storage
interface MockStore {
  campaigns: Map<string, any>;
  campaign_players: Map<string, any>;
  sessions: Map<string, any>;
  characters: Map<string, any>;
  events: Map<string, any>;
  users: Map<string, any>;
  profiles: Map<string, any>;
  [key: string]: Map<string, any>;
}

const store: MockStore = {
  campaigns: new Map(),
  campaign_players: new Map(),
  sessions: new Map(),
  characters: new Map(),
  events: new Map(),
  users: new Map(),
  profiles: new Map(),
};

// Helper to generate UUIDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Sequence counters for auto-increment fields
const sequences: Record<string, number> = {
  events_sequence: 0,
};

/**
 * Parse a simple SQL query and execute it against the mock store
 * This is a simplified parser that handles basic CRUD operations
 */
function parseAndExecuteQuery(sql: string, params: any[] = []): QueryResult<any> {
  const normalizedSql = sql.trim().toUpperCase();

  // Replace $1, $2, etc. with actual values for parsing
  let processedSql = sql;
  params.forEach((param, index) => {
    processedSql = processedSql.replace(new RegExp(`\\$${index + 1}`, 'g'),
      typeof param === 'string' ? `'${param}'` : String(param));
  });

  // SELECT query
  if (normalizedSql.startsWith('SELECT')) {
    return handleSelect(sql, params);
  }

  // INSERT query
  if (normalizedSql.startsWith('INSERT')) {
    return handleInsert(sql, params);
  }

  // UPDATE query
  if (normalizedSql.startsWith('UPDATE')) {
    return handleUpdate(sql, params);
  }

  // DELETE query
  if (normalizedSql.startsWith('DELETE')) {
    return handleDelete(sql, params);
  }

  // Transaction commands (no-op in mock)
  if (normalizedSql === 'BEGIN' || normalizedSql === 'COMMIT' || normalizedSql === 'ROLLBACK') {
    return { rows: [], rowCount: 0, command: normalizedSql, oid: 0, fields: [] };
  }

  console.warn('[MockDB] Unhandled query:', sql);
  return { rows: [], rowCount: 0, command: 'UNKNOWN', oid: 0, fields: [] };
}

function handleSelect(sql: string, params: any[]): QueryResult<any> {
  // Extract table name
  const fromMatch = sql.match(/FROM\s+["']?(\w+)["']?/i);
  if (!fromMatch) {
    return { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
  }

  const tableName = fromMatch[1].toLowerCase();

  // Auto-create table if it doesn't exist
  if (!store[tableName]) {
    store[tableName] = new Map();
  }

  let records = Array.from(store[tableName].values());

  // Handle WHERE clause
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/is);
  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    records = applyWhereClause(records, whereClause, params);
  }

  // Handle ORDER BY
  const orderMatch = sql.match(/ORDER BY\s+["']?(\w+)["']?\s*(ASC|DESC)?/i);
  if (orderMatch) {
    const orderColumn = orderMatch[1];
    const orderDir = orderMatch[2]?.toUpperCase() === 'DESC' ? -1 : 1;
    records.sort((a, b) => {
      if (a[orderColumn] < b[orderColumn]) return -1 * orderDir;
      if (a[orderColumn] > b[orderColumn]) return 1 * orderDir;
      return 0;
    });
  }

  // Handle LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    records = records.slice(0, parseInt(limitMatch[1], 10));
  }

  // Handle OFFSET
  const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
  if (offsetMatch) {
    records = records.slice(parseInt(offsetMatch[1], 10));
  }

  // Handle COUNT(*)
  if (sql.match(/COUNT\s*\(\s*\*\s*\)/i)) {
    return {
      rows: [{ count: records.length }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    };
  }

  return { rows: records, rowCount: records.length, command: 'SELECT', oid: 0, fields: [] };
}

function handleInsert(sql: string, params: any[]): QueryResult<any> {
  // Extract table name
  const tableMatch = sql.match(/INSERT INTO\s+["']?(\w+)["']?/i);
  if (!tableMatch) {
    return { rows: [], rowCount: 0, command: 'INSERT', oid: 0, fields: [] };
  }

  const tableName = tableMatch[1].toLowerCase();

  // Auto-create table if it doesn't exist
  if (!store[tableName]) {
    store[tableName] = new Map();
  }

  // Extract column names
  const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  if (!columnsMatch) {
    return { rows: [], rowCount: 0, command: 'INSERT', oid: 0, fields: [] };
  }

  const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/["']/g, ''));

  // Create the record
  const record: any = {};
  const now = new Date().toISOString();

  columns.forEach((col, index) => {
    record[col] = params[index];
  });

  // Auto-generate id if not provided
  if (!record.id) {
    record.id = generateUUID();
  }

  // Auto-set timestamps if not provided
  if (!record.created_at) {
    record.created_at = now;
  }
  if (!record.updated_at) {
    record.updated_at = now;
  }

  // Handle sequence for events table
  if (tableName === 'events' && record.sequence === undefined) {
    sequences.events_sequence = (sequences.events_sequence || 0) + 1;
    record.sequence = sequences.events_sequence;
  }

  store[tableName].set(record.id, record);

  // Check for RETURNING clause
  if (sql.match(/RETURNING/i)) {
    return { rows: [record], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
  }

  return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
}

function handleUpdate(sql: string, params: any[]): QueryResult<any> {
  // Extract table name
  const tableMatch = sql.match(/UPDATE\s+["']?(\w+)["']?/i);
  if (!tableMatch) {
    return { rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] };
  }

  const tableName = tableMatch[1].toLowerCase();

  if (!store[tableName]) {
    return { rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] };
  }

  // Extract SET clause
  const setMatch = sql.match(/SET\s+(.+?)\s*WHERE/i);
  if (!setMatch) {
    return { rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] };
  }

  // Parse SET assignments
  const setClause = setMatch[1];
  const assignments: Record<string, number> = {}; // Maps column to param index

  // Match patterns like: column = $1, column = $2
  const setPattern = /["']?(\w+)["']?\s*=\s*\$(\d+)/g;
  let match;
  while ((match = setPattern.exec(setClause)) !== null) {
    assignments[match[1]] = parseInt(match[2], 10) - 1;
  }

  // Get records matching WHERE clause
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:RETURNING|$)/is);
  let records = Array.from(store[tableName].values());

  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    records = applyWhereClause(records, whereClause, params);
  }

  // Update matching records
  const updatedRecords: any[] = [];
  for (const record of records) {
    const updated = { ...record, updated_at: new Date().toISOString() };
    for (const [col, paramIndex] of Object.entries(assignments)) {
      if (params[paramIndex] !== undefined) {
        updated[col] = params[paramIndex];
      }
    }
    store[tableName].set(record.id, updated);
    updatedRecords.push(updated);
  }

  // Check for RETURNING clause
  if (sql.match(/RETURNING/i)) {
    return { rows: updatedRecords, rowCount: updatedRecords.length, command: 'UPDATE', oid: 0, fields: [] };
  }

  return { rows: [], rowCount: updatedRecords.length, command: 'UPDATE', oid: 0, fields: [] };
}

function handleDelete(sql: string, params: any[]): QueryResult<any> {
  // Extract table name
  const tableMatch = sql.match(/DELETE FROM\s+["']?(\w+)["']?/i);
  if (!tableMatch) {
    return { rows: [], rowCount: 0, command: 'DELETE', oid: 0, fields: [] };
  }

  const tableName = tableMatch[1].toLowerCase();

  if (!store[tableName]) {
    return { rows: [], rowCount: 0, command: 'DELETE', oid: 0, fields: [] };
  }

  // Get records matching WHERE clause
  const whereMatch = sql.match(/WHERE\s+(.+?)$/is);
  let records = Array.from(store[tableName].values());

  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    records = applyWhereClause(records, whereClause, params);
  }

  // Delete matching records
  let deletedCount = 0;
  for (const record of records) {
    store[tableName].delete(record.id);
    deletedCount++;
  }

  return { rows: [], rowCount: deletedCount, command: 'DELETE', oid: 0, fields: [] };
}

function applyWhereClause(records: any[], whereClause: string, params: any[]): any[] {
  // Handle simple equality: column = $1
  const eqPattern = /["']?(\w+)["']?\s*=\s*\$(\d+)/g;
  let match;
  const conditions: Array<{ column: string; paramIndex: number; op: string }> = [];

  while ((match = eqPattern.exec(whereClause)) !== null) {
    conditions.push({
      column: match[1],
      paramIndex: parseInt(match[2], 10) - 1,
      op: '=',
    });
  }

  // Handle greater than: column > $1
  const gtPattern = /["']?(\w+)["']?\s*>\s*\$(\d+)/g;
  while ((match = gtPattern.exec(whereClause)) !== null) {
    conditions.push({
      column: match[1],
      paramIndex: parseInt(match[2], 10) - 1,
      op: '>',
    });
  }

  // Handle less than: column < $1
  const ltPattern = /["']?(\w+)["']?\s*<\s*\$(\d+)/g;
  while ((match = ltPattern.exec(whereClause)) !== null) {
    conditions.push({
      column: match[1],
      paramIndex: parseInt(match[2], 10) - 1,
      op: '<',
    });
  }

  // Handle IN: column = ANY($1)
  const inPattern = /["']?(\w+)["']?\s*=\s*ANY\s*\(\s*\$(\d+)\s*\)/gi;
  while ((match = inPattern.exec(whereClause)) !== null) {
    conditions.push({
      column: match[1],
      paramIndex: parseInt(match[2], 10) - 1,
      op: 'IN',
    });
  }

  return records.filter(record => {
    return conditions.every(cond => {
      const value = params[cond.paramIndex];
      const recordValue = record[cond.column];

      switch (cond.op) {
        case '=':
          return recordValue === value;
        case '>':
          return recordValue > value;
        case '<':
          return recordValue < value;
        case 'IN':
          return Array.isArray(value) && value.includes(recordValue);
        default:
          return true;
      }
    });
  });
}

export interface MockDatabase {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  getStore(): MockStore;
}

/**
 * Create a mock database for local development
 */
export function createMockDatabase(): MockDatabase {
  return {
    query: async <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
      return parseAndExecuteQuery(text, params || []) as QueryResult<T>;
    },
    getStore: () => store,
  };
}

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  const host = process.env.DATABASE_HOST;
  const name = process.env.DATABASE_NAME;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;

  // If DATABASE_URL is set, we're not in mock mode
  if (process.env.DATABASE_URL) {
    return false;
  }

  return !host || !name || !user || !password;
}

// Export store for testing/debugging
export { store as mockStore };
