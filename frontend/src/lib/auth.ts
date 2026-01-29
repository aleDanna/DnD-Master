/**
 * Authentication utilities for JWT-based auth with backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  email: string;
  display_name: string;
  is_admin?: boolean;
  created_at?: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  token_type: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

/**
 * Get stored auth token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/**
 * Store auth session in localStorage
 */
function storeSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth session from localStorage
 */
function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Make an authenticated API request
 */
export async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AuthResponse<T>> {
  const token = getStoredToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data as AuthResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const response = await authFetch<{
    user: User;
    access_token: string;
    token_type: string;
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  });

  if (response.success && response.data) {
    storeSession(response.data.access_token, response.data.user);
    return { user: response.data.user, error: null };
  }

  return {
    user: null,
    error: response.error || { code: 'UNKNOWN', message: 'Registration failed' },
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const response = await authFetch<{
    user: User;
    access_token: string;
    token_type: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.success && response.data) {
    storeSession(response.data.access_token, response.data.user);
    return { user: response.data.user, error: null };
  }

  return {
    user: null,
    error: response.error || { code: 'UNKNOWN', message: 'Sign in failed' },
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await authFetch('/api/auth/logout', { method: 'POST' });
  clearSession();
}

/**
 * Get current user profile from API
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  const response = await authFetch<User>('/api/auth/me');

  if (response.success && response.data) {
    // Update stored user data
    localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    return response.data;
  }

  // Token might be invalid, clear session
  if (response.error?.code === 'UNAUTHORIZED') {
    clearSession();
  }

  return null;
}

/**
 * Refresh the access token
 */
export async function refreshToken(): Promise<string | null> {
  const response = await authFetch<{
    access_token: string;
    token_type: string;
  }>('/api/auth/refresh', { method: 'POST' });

  if (response.success && response.data) {
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    return response.data.access_token;
  }

  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
