/**
 * Mock Supabase client for local development without Supabase
 * Uses in-memory storage for data
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../models/database.types.js';

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

// Mock query builder
function createMockQueryBuilder(tableName: string) {
  // Auto-create table if it doesn't exist
  if (!store[tableName]) {
    store[tableName] = new Map();
  }
  let filters: Array<{ column: string; op: string; value: any }> = [];
  let selectColumns: string = '*';
  let orderByColumn: string | null = null;
  let orderAsc: boolean = true;
  let limitCount: number | null = null;
  let singleResult: boolean = false;
  let rangeStart: number | null = null;
  let rangeEnd: number | null = null;

  const builder = {
    select(columns: string = '*') {
      selectColumns = columns;
      return builder;
    },
    insert(data: any | any[]) {
      const items = Array.isArray(data) ? data : [data];
      const inserted: any[] = [];

      for (const item of items) {
        const id = item.id || generateUUID();
        const now = new Date().toISOString();
        const record = {
          ...item,
          id,
          created_at: item.created_at || now,
          updated_at: item.updated_at || now,
        };
        store[tableName].set(id, record);
        inserted.push(record);
      }

      return {
        select() {
          return {
            single() {
              return Promise.resolve({ data: inserted[0], error: null });
            },
            async then(resolve: any) {
              resolve({ data: inserted, error: null });
            },
          };
        },
        single() {
          return Promise.resolve({ data: inserted[0], error: null });
        },
        async then(resolve: any) {
          resolve({ data: inserted, error: null });
        },
      };
    },
    update(data: any) {
      return {
        eq(column: string, value: any) {
          const records = Array.from(store[tableName].values());
          const matching = records.filter((r: any) => r[column] === value);

          for (const record of matching) {
            const updated = { ...record, ...data, updated_at: new Date().toISOString() };
            store[tableName].set(record.id, updated);
          }

          return {
            select() {
              return {
                single() {
                  const updatedRecords = Array.from(store[tableName].values())
                    .filter((r: any) => r[column] === value);
                  return Promise.resolve({ data: updatedRecords[0] || null, error: null });
                },
              };
            },
            single() {
              const updatedRecords = Array.from(store[tableName].values())
                .filter((r: any) => r[column] === value);
              return Promise.resolve({ data: updatedRecords[0] || null, error: null });
            },
            async then(resolve: any) {
              resolve({ data: null, error: null });
            },
          };
        },
      };
    },
    delete() {
      return {
        eq(column: string, value: any) {
          const records = Array.from(store[tableName].entries());
          for (const [id, record] of records) {
            if ((record as any)[column] === value) {
              store[tableName].delete(id);
            }
          }
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
    eq(column: string, value: any) {
      filters.push({ column, op: 'eq', value });
      return builder;
    },
    neq(column: string, value: any) {
      filters.push({ column, op: 'neq', value });
      return builder;
    },
    gt(column: string, value: any) {
      filters.push({ column, op: 'gt', value });
      return builder;
    },
    gte(column: string, value: any) {
      filters.push({ column, op: 'gte', value });
      return builder;
    },
    lt(column: string, value: any) {
      filters.push({ column, op: 'lt', value });
      return builder;
    },
    lte(column: string, value: any) {
      filters.push({ column, op: 'lte', value });
      return builder;
    },
    in(column: string, values: any[]) {
      filters.push({ column, op: 'in', value: values });
      return builder;
    },
    order(column: string, options?: { ascending?: boolean }) {
      orderByColumn = column;
      orderAsc = options?.ascending !== false;
      return builder;
    },
    limit(count: number) {
      limitCount = count;
      return builder;
    },
    range(from: number, to: number) {
      rangeStart = from;
      rangeEnd = to;
      return builder;
    },
    single() {
      singleResult = true;
      return builder;
    },
    maybeSingle() {
      singleResult = true;
      return builder;
    },
    async then(resolve: any) {
      let records = Array.from(store[tableName].values());

      // Apply filters
      for (const filter of filters) {
        records = records.filter((r: any) => {
          const fieldValue = r[filter.column];
          switch (filter.op) {
            case 'eq':
              return fieldValue === filter.value;
            case 'neq':
              return fieldValue !== filter.value;
            case 'gt':
              return fieldValue > filter.value;
            case 'gte':
              return fieldValue >= filter.value;
            case 'lt':
              return fieldValue < filter.value;
            case 'lte':
              return fieldValue <= filter.value;
            case 'in':
              return filter.value.includes(fieldValue);
            default:
              return true;
          }
        });
      }

      // Handle joins in select columns (e.g., "campaign:campaigns(id, name)")
      const joinMatch = selectColumns.match(/(\w+):(\w+)\(([^)]+)\)/);
      if (joinMatch) {
        const [, alias, joinTable, joinColumns] = joinMatch;
        const columns = joinColumns.split(',').map((c: string) => c.trim());
        const foreignKey = `${joinTable.replace(/s$/, '')}_id`; // e.g., campaigns -> campaign_id

        // Auto-create join table if it doesn't exist
        if (!store[joinTable]) {
          store[joinTable] = new Map();
        }

        records = records.map((record: any) => {
          const fkValue = record[foreignKey];
          const joinedRecord = store[joinTable].get(fkValue);
          if (joinedRecord) {
            const selectedFields: any = {};
            for (const col of columns) {
              selectedFields[col] = joinedRecord[col];
            }
            return { ...record, [alias]: selectedFields };
          }
          return { ...record, [alias]: null };
        });
      }

      // Apply ordering
      if (orderByColumn) {
        records.sort((a: any, b: any) => {
          const aVal = a[orderByColumn!];
          const bVal = b[orderByColumn!];
          if (aVal < bVal) return orderAsc ? -1 : 1;
          if (aVal > bVal) return orderAsc ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (limitCount !== null) {
        records = records.slice(0, limitCount);
      }

      // Apply range (pagination)
      if (rangeStart !== null && rangeEnd !== null) {
        records = records.slice(rangeStart, rangeEnd + 1);
      }

      if (singleResult) {
        if (records.length === 0) {
          // Supabase returns PGRST116 error when single() finds no rows
          resolve({
            data: null,
            error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
          });
        } else {
          resolve({ data: records[0], error: null });
        }
      } else {
        resolve({ data: records, error: null });
      }
    },
  };

  return builder;
}

// Mock auth
const mockAuth = {
  getUser(token?: string) {
    // For mock mode, return a default user
    const mockUser = {
      id: 'mock-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
      created_at: new Date().toISOString(),
    };
    return Promise.resolve({ data: { user: mockUser }, error: null });
  },
};

/**
 * Create a mock Supabase client for local development
 */
export function createMockSupabaseClient(): Partial<SupabaseClient<Database>> {
  return {
    from(table: string) {
      return createMockQueryBuilder(table) as any;
    },
    auth: mockAuth as any,
    channel() {
      return {
        on() {
          return this;
        },
        subscribe() {
          return this;
        },
        unsubscribe() {
          return Promise.resolve('ok');
        },
      } as any;
    },
  };
}

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  return !url || !serviceKey || !anonKey;
}

// Export store for testing/debugging
export { store as mockStore };
