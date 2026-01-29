import { NextResponse } from 'next/server';

/**
 * Auth callback handler
 * This route handles redirects after authentication
 * With JWT-based auth, the token is handled client-side
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  if (error) {
    // Redirect to login page with error
    return NextResponse.redirect(`${origin}/auth/login?error=${error}`);
  }

  // Redirect to the intended destination
  return NextResponse.redirect(`${origin}${next}`);
}
