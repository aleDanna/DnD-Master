'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { CampaignCard, EmptyCampaignState } from '@/components/campaign/CampaignCard';
import { campaignApi } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  dice_mode: 'rng' | 'player_entered';
  map_mode: 'grid_2d' | 'narrative_only';
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, session } = useAuth();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!session?.access_token) return;

      try {
        const result = await campaignApi.list(session.access_token);

        if (!result.success) {
          setError(result.error?.message || 'Failed to load campaigns');
          return;
        }

        setCampaigns(result.data?.campaigns || []);
      } catch (err) {
        setError('Failed to load campaigns');
        console.error('Load campaigns error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [session]);

  const handleCampaignClick = (campaign: Campaign) => {
    router.push(`/dashboard/campaigns/${campaign.id}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.user_metadata?.name || 'Adventurer'}!
          </h1>
          <p className="text-muted mt-2">Ready to begin your next adventure?</p>
        </div>

        <Link href="/dashboard/campaigns/new">
          <Button>+ New Campaign</Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      )}

      {/* Campaigns Section */}
      {!loading && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Your Campaigns</h2>

          {campaigns.length === 0 ? (
            <EmptyCampaignState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={{
                    ...campaign,
                    isOwner: campaign.owner_id === user?.id,
                  }}
                  onClick={() => handleCampaignClick(campaign)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      {!loading && campaigns.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-lg p-4 border border-border">
              <h3 className="font-medium text-foreground mb-2">Starting a Session</h3>
              <p className="text-sm text-muted">
                Click on a campaign and hit &quot;Start Session&quot; to begin playing with the AI
                Dungeon Master.
              </p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <h3 className="font-medium text-foreground mb-2">Dice Rolling</h3>
              <p className="text-sm text-muted">
                Use the dice panel during gameplay to roll any dice. The AI will factor
                results into the narrative.
              </p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <h3 className="font-medium text-foreground mb-2">Save Progress</h3>
              <p className="text-sm text-muted">
                Your session saves automatically. End a session to save a summary for
                next time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
