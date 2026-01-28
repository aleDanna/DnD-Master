'use client';

import Link from 'next/link';
import { Card } from '../ui/Card';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  dice_mode: 'rng' | 'player_entered';
  map_mode: 'grid_2d' | 'narrative_only';
  created_at: string;
  updated_at: string;
  isOwner?: boolean;
  playerCount?: number;
  hasActiveSession?: boolean;
}

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const formattedDate = new Date(campaign.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const diceModeLabel = campaign.dice_mode === 'rng' ? 'Auto Roll' : 'Manual Roll';
  const mapModeLabel = campaign.map_mode === 'grid_2d' ? '2D Grid' : 'Narrative';

  return (
    <Card hover onClick={onClick} className="group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {campaign.name}
          </h3>
          {campaign.isOwner && (
            <span className="inline-block text-xs text-muted bg-background px-2 py-0.5 rounded mt-1">
              Owner
            </span>
          )}
        </div>

        {campaign.hasActiveSession && (
          <span className="flex items-center gap-1 text-xs text-success">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Active
          </span>
        )}
      </div>

      {campaign.description && (
        <p className="text-sm text-muted line-clamp-2 mb-4">{campaign.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs px-2 py-1 bg-background rounded text-muted">
          {diceModeLabel}
        </span>
        <span className="text-xs px-2 py-1 bg-background rounded text-muted">
          {mapModeLabel}
        </span>
        {campaign.playerCount !== undefined && (
          <span className="text-xs px-2 py-1 bg-background rounded text-muted">
            {campaign.playerCount} player{campaign.playerCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Last updated: {formattedDate}</span>
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="text-primary hover:text-primary/80 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View Details →
        </Link>
      </div>
    </Card>
  );
}

// Empty state component
export function EmptyCampaignState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📜</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">No campaigns yet</h3>
      <p className="text-muted mb-6">Create your first campaign to begin your adventure</p>
      <Link
        href="/dashboard/campaigns/new"
        className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
      >
        Create Campaign
      </Link>
    </div>
  );
}

// Campaign list component
interface CampaignListProps {
  campaigns: Campaign[];
  onCampaignClick?: (campaign: Campaign) => void;
}

export function CampaignList({ campaigns, onCampaignClick }: CampaignListProps) {
  if (campaigns.length === 0) {
    return <EmptyCampaignState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onClick={() => onCampaignClick?.(campaign)}
        />
      ))}
    </div>
  );
}
