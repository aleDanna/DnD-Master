/**
 * Mock authentication client for development without Supabase
 * Uses localStorage to persist user data
 */

import type { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';

const MOCK_USERS_KEY = 'mock_auth_users';
const MOCK_SESSION_KEY = 'mock_auth_session';

interface MockUser {
  id: string;
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
  created_at: string;
}

type AuthChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

// In-memory listeners for auth state changes
const authListeners: Set<AuthChangeCallback> = new Set();

function getStoredUsers(): MockUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const users = localStorage.getItem(MOCK_USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: MockUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem(MOCK_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

function createMockUser(email: string, metadata: Record<string, unknown> = {}): User {
  const id = `mock-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: metadata,
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createMockSession(user: User): Session {
  return {
    // Use mock-jwt-{userId} format so backend can extract user ID
    access_token: `mock-jwt-${user.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: `mock-refresh-${Date.now()}`,
    user,
  };
}

function createAuthError(message: string, code: string): AuthError {
  const error = new Error(message) as AuthError;
  error.name = 'AuthError';
  error.status = 400;
  error.code = code;
  return error;
}

function notifyListeners(event: AuthChangeEvent, session: Session | null): void {
  authListeners.forEach((callback) => {
    try {
      callback(event, session);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

/**
 * Mock Supabase auth client
 */
export const mockAuth = {
  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    const session = getStoredSession();
    return { data: { session }, error: null };
  },

  onAuthStateChange(callback: AuthChangeCallback): { data: { subscription: { unsubscribe: () => void } } } {
    authListeners.add(callback);

    // Call immediately with current session
    const session = getStoredSession();
    setTimeout(() => {
      callback('INITIAL_SESSION' as AuthChangeEvent, session);
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
    const users = getStoredUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return {
        data: { user: null, session: null },
        error: createAuthError('Invalid login credentials', 'invalid_credentials'),
      };
    }

    if (user.password !== password) {
      return {
        data: { user: null, session: null },
        error: createAuthError('Invalid login credentials', 'invalid_credentials'),
      };
    }

    const mockUser = createMockUser(email, user.user_metadata);
    mockUser.id = user.id;
    mockUser.created_at = user.created_at;

    const session = createMockSession(mockUser);
    saveSession(session);
    notifyListeners('SIGNED_IN', session);

    return { data: { user: mockUser, session }, error: null };
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown> };
  }): Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }> {
    const users = getStoredUsers();

    if (users.find((u) => u.email === email)) {
      return {
        data: { user: null, session: null },
        error: createAuthError('User already registered', 'user_already_exists'),
      };
    }

    const mockUser = createMockUser(email, options?.data || {});
    const newUser: MockUser = {
      id: mockUser.id,
      email,
      password,
      user_metadata: options?.data || {},
      created_at: mockUser.created_at,
    };

    users.push(newUser);
    saveUsers(users);

    const session = createMockSession(mockUser);
    saveSession(session);
    notifyListeners('SIGNED_IN', session);

    return { data: { user: mockUser, session }, error: null };
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
    // In mock mode, just pretend it worked
    console.log('[Mock Auth] Password reset requested - in mock mode, no email sent');
    return { data: {}, error: null };
  },
};

/**
 * Mock Supabase client that wraps auth
 */
export function createMockSupabaseClient() {
  return {
    auth: mockAuth,
  };
}

/**
 * Check if we're in mock mode (no Supabase credentials)
 */
export function isMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !key;
}
