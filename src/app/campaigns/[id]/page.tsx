'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Play,
  Users,
  MapPin,
  Scroll,
  UserPlus,
  Settings,
  Calendar,
  Clock,
  Plus,
  MoreHorizontal,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

// Mock campaign data
const mockCampaign = {
  id: '1',
  name: 'The Lost Mines of Phandelver',
  description: 'A classic adventure for 1st-5th level characters. The party has been hired to escort a wagon of supplies to the frontier town of Phandalin.',
  setting: 'Sword Coast, Forgotten Realms',
  status: 'active' as const,
  startingLevel: 1,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  players: [
    { id: '1', name: 'Alice', characterName: 'Thorin Ironforge', role: 'player', avatarUrl: null },
    { id: '2', name: 'Bob', characterName: 'Elara Moonwhisper', role: 'player', avatarUrl: null },
    { id: '3', name: 'Charlie', characterName: 'Grimlock', role: 'player', avatarUrl: null },
    { id: '4', name: 'Diana', characterName: null, role: 'player', avatarUrl: null },
  ],
  sessions: [
    { id: '1', startedAt: new Date('2024-01-20'), status: 'ended', duration: 180 },
    { id: '2', startedAt: new Date('2024-01-27'), status: 'ended', duration: 210 },
    { id: '3', startedAt: new Date('2024-02-03'), status: 'ended', duration: 195 },
  ],
};

const mockNPCs = [
  { id: '1', name: 'Gundren Rockseeker', description: 'A dwarf merchant who hired the party', isAlive: true },
  { id: '2', name: 'Sildar Hallwinter', description: 'A human warrior of the Lords Alliance', isAlive: true },
  { id: '3', name: 'Klarg', description: 'Bugbear leader of the Cragmaw hideout', isAlive: false },
];

const mockLocations = [
  { id: '1', name: 'Phandalin', type: 'Town', description: 'A frontier mining town' },
  { id: '2', name: 'Cragmaw Hideout', type: 'Dungeon', description: 'A goblin hideout in the hills' },
  { id: '3', name: 'Tresendar Manor', type: 'Ruins', description: 'Ruined manor on the outskirts of town' },
];

const mockQuests = [
  { id: '1', title: 'Escort the Wagon', status: 'completed' as const, description: 'Deliver supplies to Phandalin' },
  { id: '2', title: 'Find Gundren', status: 'active' as const, description: 'Rescue Gundren from the Cragmaw goblins' },
  { id: '3', title: 'Redbrands Menace', status: 'available' as const, description: 'Deal with the Redbrand ruffians in Phandalin' },
];

type Tab = 'overview' | 'players' | 'npcs' | 'locations' | 'quests' | 'sessions';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id;

  const [campaign] = useState(mockCampaign);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNewNPCModal, setShowNewNPCModal] = useState(false);
  const [showNewLocationModal, setShowNewLocationModal] = useState(false);
  const [showNewQuestModal, setShowNewQuestModal] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getQuestStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="warning">Active</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="secondary">Available</Badge>;
    }
  };

  return (
    <AppLayout
      title={campaign.name}
      subtitle={campaign.setting}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => router.push(`/sessions/new?campaignId=${campaignId}`)}>
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Settings },
              { id: 'players', label: 'Players', icon: Users },
              { id: 'npcs', label: 'NPCs', icon: Users },
              { id: 'locations', label: 'Locations', icon: MapPin },
              { id: 'quests', label: 'Quests', icon: Scroll },
              { id: 'sessions', label: 'Sessions', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-foreground-secondary hover:text-foreground'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-foreground-secondary">{campaign.description}</p>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold">{campaign.players.length}</div>
                  <div className="text-sm text-foreground-secondary">Players</div>
                </Card>
                <Card className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-success" />
                  <div className="text-2xl font-bold">{campaign.sessions.length}</div>
                  <div className="text-sm text-foreground-secondary">Sessions</div>
                </Card>
                <Card className="p-4 text-center">
                  <Scroll className="w-6 h-6 mx-auto mb-2 text-warning" />
                  <div className="text-2xl font-bold">{mockQuests.filter(q => q.status === 'active').length}</div>
                  <div className="text-sm text-foreground-secondary">Active Quests</div>
                </Card>
                <Card className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-info" />
                  <div className="text-2xl font-bold">
                    {formatDuration(campaign.sessions.reduce((sum, s) => sum + s.duration, 0))}
                  </div>
                  <div className="text-sm text-foreground-secondary">Total Time</div>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {campaign.sessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background-secondary cursor-pointer hover:bg-background-tertiary transition-colors"
                      onClick={() => router.push(`/sessions/${session.id}`)}
                    >
                      <div>
                        <p className="font-medium">
                          Session {campaign.sessions.indexOf(session) + 1}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {session.startedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground-secondary">
                          {formatDuration(session.duration)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Campaign Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Status</span>
                    <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Starting Level</span>
                    <span>{campaign.startingLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Created</span>
                    <span>{campaign.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Players</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {campaign.players.slice(0, 4).map((player) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center">
                        {player.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{player.characterName || player.name}</p>
                        <p className="text-xs text-foreground-secondary truncate">{player.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Players ({campaign.players.length})</h2>
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Player
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.players.map((player) => (
                <Card key={player.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center text-lg">
                        {player.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-foreground-secondary">
                          {player.characterName || 'No character assigned'}
                        </p>
                        <Badge variant="secondary" className="mt-1">{player.role}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'npcs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">NPCs ({mockNPCs.length})</h2>
              <Button onClick={() => setShowNewNPCModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add NPC
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockNPCs.map((npc) => (
                <Card key={npc.id} className={cn('p-4', !npc.isAlive && 'opacity-60')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{npc.name}</p>
                        {!npc.isAlive && <Badge variant="danger">Dead</Badge>}
                      </div>
                      <p className="text-sm text-foreground-secondary mt-1">{npc.description}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Locations ({mockLocations.length})</h2>
              <Button onClick={() => setShowNewLocationModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockLocations.map((location) => (
                <Card key={location.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        <p className="font-semibold">{location.name}</p>
                      </div>
                      <Badge variant="secondary" className="mt-1">{location.type}</Badge>
                      <p className="text-sm text-foreground-secondary mt-2">{location.description}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Quests ({mockQuests.length})</h2>
              <Button onClick={() => setShowNewQuestModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Quest
              </Button>
            </div>
            <div className="space-y-3">
              {mockQuests.map((quest) => (
                <Card key={quest.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scroll className="w-4 h-4 text-warning" />
                        <p className="font-semibold">{quest.title}</p>
                        {getQuestStatusBadge(quest.status)}
                      </div>
                      <p className="text-sm text-foreground-secondary mt-2">{quest.description}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Sessions ({campaign.sessions.length})</h2>
              <Button onClick={() => router.push(`/sessions/new?campaignId=${campaignId}`)}>
                <Play className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </div>
            <div className="space-y-3">
              {campaign.sessions.map((session, index) => (
                <Card
                  key={session.id}
                  className="p-4 cursor-pointer hover:bg-background-secondary transition-colors"
                  onClick={() => router.push(`/sessions/${session.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Session {index + 1}</p>
                      <p className="text-sm text-foreground-secondary">
                        {session.startedAt.toLocaleDateString()} - {formatDuration(session.duration)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={session.status === 'ended' ? 'secondary' : 'success'}>
                        {session.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Player Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Player">
        <div className="space-y-4">
          <Input placeholder="Email address" />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setShowInviteModal(false)}>
              Send Invite
            </Button>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* New NPC Modal */}
      <Modal isOpen={showNewNPCModal} onClose={() => setShowNewNPCModal(false)} title="Create NPC">
        <div className="space-y-4">
          <Input placeholder="NPC Name" />
          <Textarea placeholder="Description" rows={3} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setShowNewNPCModal(false)}>
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowNewNPCModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Location Modal */}
      <Modal isOpen={showNewLocationModal} onClose={() => setShowNewLocationModal(false)} title="Create Location">
        <div className="space-y-4">
          <Input placeholder="Location Name" />
          <Input placeholder="Location Type (e.g., Town, Dungeon)" />
          <Textarea placeholder="Description" rows={3} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setShowNewLocationModal(false)}>
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowNewLocationModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Quest Modal */}
      <Modal isOpen={showNewQuestModal} onClose={() => setShowNewQuestModal(false)} title="Create Quest">
        <div className="space-y-4">
          <Input placeholder="Quest Title" />
          <Textarea placeholder="Description" rows={3} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setShowNewQuestModal(false)}>
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowNewQuestModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
