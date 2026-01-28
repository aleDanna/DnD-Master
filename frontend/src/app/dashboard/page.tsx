'use client';

import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.user_metadata?.name || 'Adventurer'}!
        </h1>
        <p className="text-muted mt-2">Ready to begin your next adventure?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/campaigns/new"
              className="flex items-center px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
            >
              <span className="mr-3">+</span>
              New Campaign
            </Link>
            <Link
              href="/dashboard/characters/new"
              className="flex items-center px-4 py-3 bg-background hover:bg-border text-foreground rounded-md transition-colors border border-border"
            >
              <span className="mr-3">+</span>
              New Character
            </Link>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Campaigns</h2>
          <div className="text-muted text-sm">
            <p>No campaigns yet.</p>
            <p className="mt-2">
              <Link href="/dashboard/campaigns/new" className="text-primary hover:text-primary/80">
                Create your first campaign
              </Link>
            </p>
          </div>
        </div>

        {/* Your Characters */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Characters</h2>
          <div className="text-muted text-sm">
            <p>No characters created yet.</p>
            <p className="mt-2">
              <Link href="/dashboard/characters/new" className="text-primary hover:text-primary/80">
                Create a character
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
