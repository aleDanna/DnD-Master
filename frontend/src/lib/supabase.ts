import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for browser/client-side usage
 * This client is used for authentication and real-time subscriptions
 */
export function createClient() {
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
