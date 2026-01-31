'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/dashboard" className="text-xl font-bold text-foreground">
            D&D Master
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-foreground hover:bg-background rounded-md transition-colors"
          >
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          <Link
            href="/dashboard/campaigns"
            className="flex items-center px-4 py-2 text-foreground hover:bg-background rounded-md transition-colors"
          >
            <span className="mr-3">📜</span>
            Campaigns
          </Link>
          <Link
            href="/dashboard/characters"
            className="flex items-center px-4 py-2 text-foreground hover:bg-background rounded-md transition-colors"
          >
            <span className="mr-3">🧙</span>
            Characters
          </Link>
          <Link
            href="/rules"
            className="flex items-center px-4 py-2 text-foreground hover:bg-background rounded-md transition-colors"
          >
            <span className="mr-3">📖</span>
            Rules Explorer
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-foreground truncate">
                {user.user_metadata?.name || user.email}
              </p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 p-2 text-muted hover:text-foreground hover:bg-background rounded-md transition-colors"
              title="Sign out"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
