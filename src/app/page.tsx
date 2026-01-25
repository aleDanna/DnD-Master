'use client';

import Link from 'next/link';
import {
  Users,
  Map,
  Swords,
  BookOpen,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Calendar,
  Dices,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Mock data for demo
const recentCampaigns = [
  {
    id: '1',
    name: 'Lost Mines of Phandelver',
    players: 4,
    lastPlayed: '2 days ago',
    status: 'active',
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    players: 5,
    lastPlayed: '1 week ago',
    status: 'active',
  },
  {
    id: '3',
    name: 'Storm King\'s Thunder',
    players: 3,
    lastPlayed: '3 weeks ago',
    status: 'paused',
  },
];

const recentCharacters = [
  {
    id: '1',
    name: 'Thorin Ironforge',
    race: 'Dwarf',
    class: 'Fighter',
    level: 5,
  },
  {
    id: '2',
    name: 'Elara Moonwhisper',
    race: 'Elf',
    class: 'Wizard',
    level: 5,
  },
  {
    id: '3',
    name: 'Grok the Mighty',
    race: 'Half-Orc',
    class: 'Barbarian',
    level: 4,
  },
];

const quickStats = [
  { label: 'Active Campaigns', value: '3', icon: Map, color: 'text-accent' },
  { label: 'Total Characters', value: '12', icon: Users, color: 'text-info' },
  { label: 'Sessions Played', value: '47', icon: BookOpen, color: 'text-warning' },
  { label: 'Combat Encounters', value: '89', icon: Swords, color: 'text-error' },
];

const upcomingSessions = [
  {
    id: '1',
    campaign: 'Lost Mines of Phandelver',
    date: 'Tomorrow, 7:00 PM',
    players: ['Thorin', 'Elara', 'Grok', 'Luna'],
  },
  {
    id: '2',
    campaign: 'Curse of Strahd',
    date: 'Saturday, 3:00 PM',
    players: ['Raven', 'Zephyr', 'Kai', 'Nova', 'Finn'],
  },
];

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Welcome back, Dungeon Master">
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-secondary">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-background-secondary ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">Recent Campaigns</h2>
                <Link href="/campaigns">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between p-4 hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Map className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-foreground-secondary">
                          {campaign.players} players
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground-tertiary">
                        {campaign.lastPlayed}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Link href="/campaigns/new">
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <Card>
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Upcoming Sessions</h2>
              </div>
              <div className="divide-y divide-border">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4">
                    <div className="flex items-center gap-2 text-accent mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{session.date}</span>
                    </div>
                    <p className="font-medium">{session.campaign}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {session.players.slice(0, 3).map((player, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-background-tertiary border-2 border-background flex items-center justify-center text-xs"
                          >
                            {player[0]}
                          </div>
                        ))}
                        {session.players.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-background-tertiary border-2 border-background flex items-center justify-center text-xs">
                            +{session.players.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-foreground-secondary">
                        {session.players.length} players
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Characters Section */}
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Your Characters</h2>
            <Link href="/characters">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {recentCharacters.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className="p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-background-secondary transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{character.name}</p>
                    <p className="text-sm text-foreground-secondary">
                      {character.race} {character.class}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-foreground-tertiary">Level {character.level}</span>
                  <div className="flex items-center gap-1 text-accent">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              href="/characters/new"
              className="p-4 rounded-lg border border-dashed border-border hover:border-accent/50 hover:bg-background-secondary transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center">
                <Plus className="w-6 h-6 text-foreground-secondary" />
              </div>
              <span className="text-sm text-foreground-secondary">Create Character</span>
            </Link>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/tools/dice">
            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Dices className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Dice Roller</p>
                  <p className="text-sm text-foreground-secondary">Roll any dice</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/combat">
            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <Swords className="w-5 h-5 text-error" />
                </div>
                <div>
                  <p className="font-medium">Start Combat</p>
                  <p className="text-sm text-foreground-secondary">Initiative tracker</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/sessions/new">
            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <BookOpen className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">New Session</p>
                  <p className="text-sm text-foreground-secondary">Start playing</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/tools/ai-dm">
            <Card className="p-4 hover:border-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="font-medium">AI Assistant</p>
                  <p className="text-sm text-foreground-secondary">Get DM help</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
