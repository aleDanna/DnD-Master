/**
 * Authentication client for frontend
 * Communicates with backend API for authentication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  display_name?: string;
  user_metadata?: Record<string, unknown>;
}

export interface Session {
  access_token: string;
  user: User;
}

export interface AuthError {
  message: string;
  code?: string;
  name?: string;
  status?: number;
}

// Storage keys
const SESSION_KEY = 'dnd_auth_session';

// In-memory listeners for auth state changes
type AuthChangeCallback = (event: string, session: Session | null) => void;
const authListeners: Set<AuthChangeCallback> = new Set();

function notifyListeners(event: string, session: Session | null): void {
  authListeners.forEach((callback) => {
    try {
      callback(event, session);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Auth client for frontend authentication
 */
export const auth = {
  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    const session = getStoredSession();
    return { data: { session }, error: null };
  },

  onAuthStateChange(callback: AuthChangeCallback): { data: { subscription: { unsubscribe: () => void } } } {
    authListeners.add(callback);

    // Call immediately with current session
    const session = getStoredSession();
    setTimeout(() => {
      callback('INITIAL_SESSION', session);
    }, 0);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  },

  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          data: { user: null, session: null },
          error: { message: result.error?.message || 'Login failed', code: result.error?.code },
        };
      }

      const user: User = {
        ...result.data.user,
        user_metadata: { name: result.data.user.display_name },
      };

      const session: Session = {
        access_token: result.data.token,
        user,
      };

      saveSession(session);
      notifyListeners('SIGNED_IN', session);

      return { data: { user, session }, error: null };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: { message: 'Network error. Please try again.' },
      };
    }
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: { name?: string } };
  }): Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          display_name: options?.data?.name || email.split('@')[0],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          data: { user: null, session: null },
          error: { message: result.error?.message || 'Registration failed', code: result.error?.code },
        };
      }

      const user: User = {
        ...result.data.user,
        user_metadata: { name: result.data.user.display_name },
      };

      const session: Session = {
        access_token: result.data.token,
        user,
      };

      saveSession(session);
      notifyListeners('SIGNED_IN', session);

      return { data: { user, session }, error: null };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: { message: 'Network error. Please try again.' },
      };
    }
  },

  async signOut(): Promise<{ error: null }> {
    saveSession(null);
    notifyListeners('SIGNED_OUT', null);
    return { error: null };
  },

  async resetPasswordForEmail(
    _email: string,
    _options?: { redirectTo?: string }
  ): Promise<{ data: object; error: null }> {
    // Password reset would require backend implementation
    console.log('[Auth] Password reset requested - feature not yet implemented');
    return { data: {}, error: null };
  },

  async getUser(token?: string): Promise<{ data: { user: User | null }; error: AuthError | null }> {
    const session = getStoredSession();
    if (!session) {
      return { data: { user: null }, error: null };
    }
    return { data: { user: session.user }, error: null };
  },
};

/**
 * Create a client (for compatibility with existing code)
 */
export function createClient() {
  return {
    auth,
  };
}

/**
 * Get the auth client singleton
 */
let clientInstance: { auth: typeof auth } | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

/**
 * Check if running in mock mode (for development)
 */
export function isMockMode(): boolean {
  return !process.env.NEXT_PUBLIC_API_URL;
}
