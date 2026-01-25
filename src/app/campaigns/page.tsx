'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Map,
  Users,
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Archive,
  Settings,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Mock data
const campaigns = [
  {
    id: '1',
    name: 'Lost Mines of Phandelver',
    description: 'A classic introductory adventure set in the Sword Coast. The party must rescue a kidnapped dwarf and uncover the secrets of Wave Echo Cave.',
    players: [
      { id: '1', name: 'Thorin', character: 'Fighter' },
      { id: '2', name: 'Elara', character: 'Wizard' },
      { id: '3', name: 'Grok', character: 'Barbarian' },
      { id: '4', name: 'Luna', character: 'Warlock' },
    ],
    sessions: 12,
    lastPlayed: '2 days ago',
    status: 'active' as const,
    setting: 'Forgotten Realms',
    level: '1-5',
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    description: 'A gothic horror adventure in the dark realm of Barovia. The party must confront the vampire lord Strahd von Zarovich.',
    players: [
      { id: '5', name: 'Raven', character: 'Rogue' },
      { id: '6', name: 'Zephyr', character: 'Cleric' },
      { id: '7', name: 'Kai', character: 'Paladin' },
      { id: '8', name: 'Nova', character: 'Sorcerer' },
      { id: '9', name: 'Finn', character: 'Ranger' },
    ],
    sessions: 8,
    lastPlayed: '1 week ago',
    status: 'active' as const,
    setting: 'Ravenloft',
    level: '1-10',
  },
  {
    id: '3',
    name: "Storm King's Thunder",
    description: 'Giants have emerged to threaten civilization as never before. The party must discover what is driving their forward.',
    players: [
      { id: '10', name: 'Ash', character: 'Fighter' },
      { id: '11', name: 'Sage', character: 'Druid' },
      { id: '12', name: 'Blake', character: 'Bard' },
    ],
    sessions: 3,
    lastPlayed: '3 weeks ago',
    status: 'paused' as const,
    setting: 'Forgotten Realms',
    level: '1-11',
  },
  {
    id: '4',
    name: 'Tomb of Annihilation',
    description: 'A death curse has befallen the world, and the party must travel to the jungles of Chult to end it.',
    players: [],
    sessions: 0,
    lastPlayed: null,
    status: 'planning' as const,
    setting: 'Forgotten Realms',
    level: '1-11',
  },
];

const statusColors = {
  active: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  completed: 'bg-info/10 text-info',
  planning: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      title="Campaigns"
      subtitle={`${campaigns.length} campaigns`}
      actions={
        <Link href="/campaigns/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      }
    >
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1 bg-background-secondary rounded-lg p-1">
            {['all', 'active', 'paused', 'planning', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors',
                  statusFilter === status
                    ? 'bg-background text-foreground'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="relative group">
              <Link href={`/campaigns/${campaign.id}`}>
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Map className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-foreground-secondary">
                          {campaign.setting} • Levels {campaign.level}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium capitalize',
                        statusColors[campaign.status]
                      )}
                    >
                      {campaign.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Players */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                      {campaign.players.slice(0, 4).map((player) => (
                        <div
                          key={player.id}
                          className="w-8 h-8 rounded-full bg-background-tertiary border-2 border-background flex items-center justify-center text-xs font-medium"
                          title={`${player.name} (${player.character})`}
                        >
                          {player.name[0]}
                        </div>
                      ))}
                      {campaign.players.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-background-tertiary border-2 border-background flex items-center justify-center text-xs">
                          +{campaign.players.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      {campaign.players.length > 0
                        ? `${campaign.players.length} players`
                        : 'No players yet'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{campaign.sessions} sessions</span>
                    </div>
                    {campaign.lastPlayed && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{campaign.lastPlayed}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Quick Actions */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenuId(openMenuId === campaign.id ? null : campaign.id);
                  }}
                  className="p-1.5 rounded-md hover:bg-background-secondary opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuId === campaign.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 mt-1 w-44 bg-background border border-border rounded-lg shadow-lg z-20">
                      <div className="p-1">
                        {campaign.status === 'active' && (
                          <Link
                            href={`/sessions/new?campaign=${campaign.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary"
                          >
                            <Play className="w-4 h-4" />
                            Start Session
                          </Link>
                        )}
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <Link
                          href={`/campaigns/${campaign.id}/settings`}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        {campaign.status === 'active' ? (
                          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary w-full text-left">
                            <Pause className="w-4 h-4" />
                            Pause Campaign
                          </button>
                        ) : campaign.status === 'paused' ? (
                          <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary w-full text-left">
                            <Play className="w-4 h-4" />
                            Resume Campaign
                          </button>
                        ) : null}
                        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary w-full text-left">
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-background-secondary w-full text-left text-error">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}

          {/* New Campaign Card */}
          <Link href="/campaigns/new">
            <Card className="h-full min-h-[200px] flex flex-col items-center justify-center gap-3 border-dashed hover:border-accent/50 hover:bg-background-secondary transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center">
                <Plus className="w-6 h-6 text-foreground-secondary" />
              </div>
              <span className="text-foreground-secondary">Create Campaign</span>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
