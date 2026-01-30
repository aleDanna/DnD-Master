import { cookies } from 'next/headers';

/**
 * Server-side authentication helpers
 * For use in Server Components and Route Handlers
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SESSION_COOKIE_NAME = 'dnd_auth_token';

export interface User {
  id: string;
  email: string;
  display_name?: string;
}

export interface Session {
  access_token: string;
  user: User;
}

/**
 * Get the current session from cookies (server-side)
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Decode JWT payload (without verification - verification happens on backend)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return {
      access_token: token,
      user: {
        id: payload.sub,
        email: payload.email,
        display_name: payload.display_name,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Create a server-side auth client (for compatibility)
 */
export async function createServerAuthClient() {
  const session = await getServerSession();

  return {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: session?.user || null }, error: null }),
      exchangeCodeForSession: async (_code: string) => {
        // OAuth code exchange is not supported in this implementation
        console.warn('[Server Auth] OAuth code exchange not implemented');
        return { error: { message: 'OAuth not implemented' } };
      },
    },
  };
}

/**
 * Verify a session token with the backend
 */
export async function verifySession(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.success ? result.data.user : null;
  } catch {
    return null;
  }
}
