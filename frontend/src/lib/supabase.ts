import { createBrowserClient } from '@supabase/ssr';
import { createMockSupabaseClient, isMockMode } from './mockAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Check if we're running in mock mode (no Supabase credentials)
 */
export { isMockMode };

/**
 * Create a Supabase client for browser/client-side usage
 * This client is used for authentication and real-time subscriptions
 * Falls back to mock client if Supabase credentials are not configured
 */
export function createClient() {
  if (isMockMode()) {
    console.warn('[Supabase] Running in MOCK MODE - no Supabase credentials found');
    console.warn('[Supabase] Auth will use localStorage. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for real Supabase.');
    return createMockSupabaseClient() as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton instance for client-side usage
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
