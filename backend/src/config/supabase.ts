import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../models/database.types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client with service role key for backend operations.
 * This bypasses RLS and should only be used for server-side operations.
 */
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
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

export { supabaseUrl, supabaseAnonKey };
