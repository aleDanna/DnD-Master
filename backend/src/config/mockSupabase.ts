/**
 * @deprecated Mock Supabase has been replaced with direct PostgreSQL.
 *
 * This file is kept as a stub to prevent import errors.
 * The application now uses direct PostgreSQL connections via database.ts.
 */

// Stub exports to prevent import errors
export function createMockSupabaseClient(): null {
  console.warn('DEPRECATED: createMockSupabaseClient is no longer available.');
  return null;
}

export function isMockMode(): boolean {
  return false;
}

export const mockStore = {};
