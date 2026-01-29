import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../models/database.types.js';
import { createMockSupabaseClient, isMockMode } from './mockSupabase.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if we're in mock mode
const mockMode = isMockMode();

if (mockMode) {
  console.warn('[Supabase] Running in MOCK MODE - no Supabase credentials found');
  console.warn('[Supabase] Data will be stored in memory and lost on restart');
  console.warn('[Supabase] Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY for real Supabase');
}

/**
 * Supabase client with service role key for backend operations.
 * This bypasses RLS and should only be used for server-side operations.
 */
export const supabaseAdmin: SupabaseClient<Database> = mockMode
  ? (createMockSupabaseClient() as SupabaseClient<Database>)
  : createClient<Database>(
      supabaseUrl!,
      supabaseServiceKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

/**
 * Creates a Supabase client for a specific user's JWT token.
 * This respects RLS policies and should be used for user-initiated operations.
 */
export function createUserClient(accessToken: string): SupabaseClient<Database> {
  if (mockMode) {
    return createMockSupabaseClient() as SupabaseClient<Database>;
  }

  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { supabaseUrl, supabaseAnonKey, mockMode as isMockMode };
