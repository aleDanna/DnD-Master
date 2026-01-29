'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  User,
  AuthError,
  signIn as apiSignIn,
  register as apiRegister,
  signOut as apiSignOut,
  getStoredUser,
  getStoredToken,
  getCurrentUser,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const initializeAuth = async () => {
      try {
        const storedUser = getStoredUser();
        const token = getStoredToken();

        if (storedUser && token) {
          setUser(storedUser);
          // Verify token is still valid by fetching current user
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await apiSignIn(email, password);
      if (result.user) {
        setUser(result.user);
      }
      return { error: result.error };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const result = await apiRegister(email, password, displayName || email.split('@')[0]);
      if (result.user) {
        setUser(result.user);
      }
      return { error: result.error };
    },
    []
  );

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
