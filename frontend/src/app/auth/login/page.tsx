'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted mt-2">Sign in to continue your adventure</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="adventurer@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:text-primary/80 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
