import { NextResponse } from 'next/server';

/**
 * Auth callback handler
 * Since we're using JWT-based auth instead of OAuth, this route
 * simply redirects to the dashboard or login page
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');

  if (error) {
    // Redirect to login with error
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`);
  }

  // Redirect to the intended destination
  return NextResponse.redirect(`${origin}${next}`);
}
