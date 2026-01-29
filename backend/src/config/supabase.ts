/**
 * @deprecated Supabase has been replaced with direct PostgreSQL.
 *
 * This file is kept as a stub to prevent import errors.
 * All database operations should use the new database.ts and auth.ts modules.
 *
 * Migration notes:
 * - Use `import { db, query } from './database.js'` for database operations
 * - Use `import { verifyToken, registerUser, loginUser } from './auth.js'` for authentication
 * - Repositories no longer need a client parameter
 */

// Stub exports to prevent import errors
export const supabaseAdmin = null;
export const supabaseUrl = null;
export const supabaseAnonKey = null;
export const isMockMode = false;

export function createUserClient(_accessToken: string): null {
  console.warn('DEPRECATED: createUserClient is no longer available. Use direct PostgreSQL instead.');
  return null;
}

export function createAdminClient(): null {
  console.warn('DEPRECATED: createAdminClient is no longer available. Use direct PostgreSQL instead.');
  return null;
}
