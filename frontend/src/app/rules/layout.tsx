'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';

/**
 * Rules Explorer Layout
 * Provides consistent navigation for rules pages
 */

interface RulesLayoutProps {
  children: React.ReactNode;
}

export default function RulesLayout({ children }: RulesLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center px-4">
        <Link href="/dashboard" className="text-xl font-bold text-foreground mr-8">
          D&D Master
        </Link>

        <nav className="flex-1 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/campaigns"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Campaigns
          </Link>
          <Link
            href="/rules"
            className="text-sm text-primary font-medium"
          >
            Rules Explorer
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {user.user_metadata?.name || user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
