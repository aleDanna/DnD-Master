import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * Auth callback handler for Supabase email confirmation and OAuth
 * Exchanges the auth code for a session and redirects to dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login page with error if code exchange failed
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
